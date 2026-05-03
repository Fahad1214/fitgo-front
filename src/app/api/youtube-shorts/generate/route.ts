import { NextResponse } from "next/server";
import { mkdir, readFile, rm, readdir, stat, writeFile } from "fs/promises";
import { createWriteStream, existsSync } from "fs";
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
const SHORTS_WIDTH = 720;
const SHORTS_HEIGHT = 1280;


const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.SHORTS_ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

type YtJson = {
  duration?: number;
  is_live?: boolean;
  title?: string;
};


function youtubeCookieMode(): string {
  if (process.env.YT_DLP_COOKIES_BASE64?.trim()) return "base64";
  if (process.env.YT_DLP_COOKIES_TEXT?.trim()) return "text";
  if (process.env.YT_DLP_COOKIES_FILE?.trim()) return "file";
  if (process.env.YT_DLP_COOKIES_FROM_BROWSER?.trim()) return "browser";
  return "none";
}

async function youtubeCookieFlags(workDir: string): Promise<Record<string, string>> {
  const cookieFile = process.env.YT_DLP_COOKIES_FILE?.trim();
  const cookiesFromBrowser = process.env.YT_DLP_COOKIES_FROM_BROWSER?.trim();
  const cookiesBase64 = process.env.YT_DLP_COOKIES_BASE64?.trim();
  const cookiesText = process.env.YT_DLP_COOKIES_TEXT?.trim();
  const flags: Record<string, string> = {};

  if (cookiesBase64) {
    const target = join(workDir, "youtube-cookies.txt");
    await writeFile(target, Buffer.from(cookiesBase64, "base64"));
    flags.cookies = target;
    return flags;
  }

  if (cookiesText) {
    const target = join(workDir, "youtube-cookies.txt");
    await writeFile(target, cookiesText);
    flags.cookies = target;
    return flags;
  }

  if (cookieFile) {
    if (cookieFile.includes("/absolute/path/to/") || cookieFile.includes("your-cookies")) {
      throw new Error(
        "YT_DLP_COOKIES_FILE is still a placeholder. Set it to a real cookies.txt path, or use YT_DLP_COOKIES_BASE64 on Vercel/staging."
      );
    }
    if (!existsSync(cookieFile)) {
      throw new Error(
        `YT_DLP_COOKIES_FILE does not exist: ${cookieFile}. Use a real absolute path locally, or YT_DLP_COOKIES_BASE64 on hosted environments.`
      );
    }
    flags.cookies = cookieFile;
  }

  if (cookiesFromBrowser) flags.cookiesFromBrowser = cookiesFromBrowser;
  return flags;
}

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
    // boxblur is available in older static ffmpeg builds where gblur may be missing.
    `[v0]scale=${SHORTS_WIDTH}:${SHORTS_HEIGHT}:force_original_aspect_ratio=increase,crop=${SHORTS_WIDTH}:${SHORTS_HEIGHT},boxblur=16:1[bg]`,
    `[v1]scale=${SHORTS_WIDTH}:${SHORTS_HEIGHT}:force_original_aspect_ratio=decrease[fg]`,
    "[bg][fg]overlay=(W-w)/2:(H-h)/2[vout]",
  ].join(";");
}

function cleanFfmpegError(stderr: string | null | undefined, fallback: string): string {
  const raw = [stderr, fallback].filter(Boolean).join("\n");
  if (!raw.trim()) return "ffmpeg failed while rendering the clip.";

  const lines = raw
    .replace(/ffmpeg version[^\n\r]*/gi, "")
    .replace(/configuration:[^\n\r]*/gi, "")
    .replace(/built with[^\n\r]*/gi, "")
    .replace(/Copyright[^\n\r]*/gi, "")
    .split(/\r?\n|(?=Input #)|(?=Output #)|(?=Stream #)|(?=\[)|(?=Error)|(?=Invalid)|(?=No such)|(?=Conversion failed)/)
    .map((line) => line.trim())
    .filter(Boolean);

  const errorLines = lines.filter((line) =>
    /error|invalid|failed|no such|not found|unable|unknown|conversion failed|filter/i.test(line)
  );
  const selected = errorLines.length ? errorLines : lines.slice(-10);
  return selected.join(" ").slice(0, 1200) || "ffmpeg failed while rendering the clip.";
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
      .addOption("-hide_banner")
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
        "ultrafast",
        "-threads",
        "1",
        "-crf",
        "24",
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
        reject(new Error(cleanFfmpegError(stderr, err.message)));
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
        { status: 400, headers: CORS_HEADERS }
      );
    }

    workDir = join(tmpdir(), `fitgo-shorts-${randomUUID()}`);
    await mkdir(workDir, { recursive: true });

    const ffmpegLoc = dirname(ffmpegInstaller.path);
    const cookieFlags = await youtubeCookieFlags(workDir);

    let info: YtJson;
    try {
      info = (await youtubedl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noPlaylist: true,
        skipDownload: true,
        ...cookieFlags,
      })) as YtJson;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not read video info";
      const compact = msg.replace(/\s+/g, " ").slice(0, 800);
      const needsCookies = /Sign in to confirm you.?re not a bot|cookies-from-browser|Use --cookies/i.test(compact);
      return NextResponse.json(
        {
          message: needsCookies
            ? `${compact} Cookie mode detected: ${youtubeCookieMode()}. On Vercel Preview, set YT_DLP_COOKIES_BASE64 for the Preview environment and redeploy. YT_DLP_COOKIES_FILE only works when that file exists on the server.`
            : compact,
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (info.is_live) {
      return NextResponse.json(
        { message: "Live streams are not supported. Use a finished upload." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const dur =
      typeof info.duration === "number" && info.duration > 0 ? info.duration : 0;
    if (!dur) {
      return NextResponse.json(
        { message: "Could not determine video length." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (dur > MAX_SOURCE_DURATION_SEC) {
      return NextResponse.json(
        {
          message: `Video is too long for this tool (max ${MAX_SOURCE_DURATION_SEC / 60} minutes).`,
        },
        { status: 400, headers: CORS_HEADERS }
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
      ...cookieFlags,
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
        ...cookieFlags,
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
        ...CORS_HEADERS,
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
      { status: 500, headers: CORS_HEADERS }
    );
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
