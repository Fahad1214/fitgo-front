import { NextResponse } from "next/server";
import { mkdir, readFile, rm, readdir, stat } from "fs/promises";
import { createWriteStream } from "fs";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { finished } from "stream/promises";
import archiver from "archiver";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { configureFfmpeg } from "@/lib/ffmpeg-paths";
import { getYoutubedl } from "@/lib/ytdlp";
import { extractYoutubeId } from "@/lib/youtube-id";
import {
  clampClipCount,
  computeShortsSegments,
} from "@/lib/shorts-segments";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_SOURCE_DURATION_SEC = 2 * 60 * 60;

type YtJson = {
  duration?: number;
  is_live?: boolean;
  title?: string;
};

async function findDownloadedVideo(dir: string): Promise<string> {
  const entries = await readdir(dir);
  const scored: { path: string; size: number }[] = [];
  for (const name of entries) {
    if (name.startsWith(".") || name.endsWith(".part")) continue;
    const full = join(dir, name);
    const s = await stat(full);
    if (!s.isFile()) continue;
    if (!/\.(mp4|webm|mkv|mov)$/i.test(name)) continue;
    scored.push({ path: full, size: s.size });
  }
  if (!scored.length) {
    throw new Error("Downloaded video file not found");
  }
  scored.sort((a, b) => b.size - a.size);
  return scored[0].path;
}

/** Blurred 9:16 fill + sharp “contain” layer — avoids harsh center-crop on landscape sources. */
function shortsVerticalFilterComplex(): string {
  return [
    "[0:v]split=2[v0][v1]",
    "[v0]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=28[bg]",
    "[v1]scale=1080:1920:force_original_aspect_ratio=decrease[fg]",
    "[bg][fg]overlay=(W-w)/2:(H-h)/2[vout]",
  ].join(";");
}

function runFfmpegSegment(
  source: string,
  output: string,
  start: number,
  durationSec: number
): Promise<void> {
  configureFfmpeg();
  return new Promise((resolve, reject) => {
    ffmpeg(source)
      .setStartTime(start)
      .setDuration(durationSec)
      .complexFilter(shortsVerticalFilterComplex())
      .outputOptions([
        "-map",
        "[vout]",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "-pix_fmt",
        "yuv420p",
      ])
      .output(output)
      .on("end", () => resolve())
      .on("error", (err, _stdout, stderr) => {
        reject(new Error(stderr?.trim() || err.message));
      })
      .run();
  });
}

export async function POST(req: Request) {
  let workDir: string | null = null;

  try {
    configureFfmpeg();
    const youtubedl = getYoutubedl();
    const body = (await req.json().catch(() => ({}))) as {
      url?: unknown;
      clipCount?: unknown;
    };
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const clipCount = clampClipCount(body.clipCount);
    if (!url || !extractYoutubeId(url)) {
      return NextResponse.json(
        { message: "Paste a valid YouTube link." },
        { status: 400 }
      );
    }

    workDir = join(tmpdir(), `fitgo-shorts-${randomUUID()}`);
    await mkdir(workDir, { recursive: true });

    const ffmpegLoc = dirname(ffmpegInstaller.path);

    let info: YtJson;
    try {
      info = (await youtubedl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noPlaylist: true,
        skipDownload: true,
      })) as YtJson;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not read video info";
      return NextResponse.json(
        { message: msg.replace(/\s+/g, " ").slice(0, 800) },
        { status: 400 }
      );
    }

    if (info.is_live) {
      return NextResponse.json(
        { message: "Live streams are not supported. Use a finished upload." },
        { status: 400 }
      );
    }

    const dur =
      typeof info.duration === "number" && info.duration > 0 ? info.duration : 0;
    if (!dur) {
      return NextResponse.json(
        { message: "Could not determine video length." },
        { status: 400 }
      );
    }

    if (dur > MAX_SOURCE_DURATION_SEC) {
      return NextResponse.json(
        {
          message: `Video is too long for this tool (max ${MAX_SOURCE_DURATION_SEC / 60} minutes).`,
        },
        { status: 400 }
      );
    }

    const downloadOpts = {
      output: join(workDir, "src.%(ext)s"),
      format:
        "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[ext=mp4]/best",
      mergeOutputFormat: "mp4" as const,
      ffmpegLocation: ffmpegLoc,
      noPlaylist: true,
      noWarnings: true,
    };

    try {
      await youtubedl(url, downloadOpts);
    } catch {
      await youtubedl(url, {
        output: join(workDir, "src.%(ext)s"),
        format: "best[ext=mp4]/best",
        ffmpegLocation: ffmpegLoc,
        noPlaylist: true,
        noWarnings: true,
      });
    }

    const sourcePath = await findDownloadedVideo(workDir);
    const segments = computeShortsSegments(dur, clipCount);
    const shortPaths: string[] = [];

    for (let i = 0; i < segments.length; i++) {
      const out = join(workDir, `short-${i + 1}.mp4`);
      await runFfmpegSegment(
        sourcePath,
        out,
        segments[i].start,
        segments[i].len
      );
      shortPaths.push(out);
    }

    const zipPath = join(workDir, "fitgo-shorts.zip");
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.pipe(output);

    for (let i = 0; i < shortPaths.length; i++) {
      archive.file(shortPaths[i], { name: `short-${i + 1}.mp4` });
    }
    archive.append(
      Buffer.from(
        JSON.stringify(
          {
            title: info.title ?? null,
            sourceDurationSeconds: dur,
            clipCount: segments.length,
            clips: segments.map((s, idx) => ({
              file: `short-${idx + 1}.mp4`,
              startSeconds: s.start,
              lengthSeconds: s.len,
            })),
          },
          null,
          2
        )
      ),
      { name: "clips-info.json" }
    );

    await archive.finalize();
    await finished(output);

    const zipBuffer = await readFile(zipPath);

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="fitgo-shorts.zip"',
      },
    });
  } catch (err) {
    console.error(err);
    const message =
      err instanceof Error ? err.message : "Something went wrong while creating shorts.";
    return NextResponse.json(
      { message: message.replace(/\s+/g, " ").slice(0, 800) },
      { status: 500 }
    );
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
