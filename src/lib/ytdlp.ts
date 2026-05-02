import { existsSync, realpathSync } from "fs";
import { execFileSync } from "child_process";
import { homedir } from "os";
import { cwd } from "process";
import { join } from "path";
import { create } from "youtube-dl-exec";
import defaultYtdl from "youtube-dl-exec";

/** Same callable shape as the default `youtube-dl-exec` export (includes `.exec`). */
type YoutubeDl = typeof defaultYtdl;

let cached: YoutubeDl | null = null;

function isExecutableFile(path: string): boolean {
  try {
    if (!existsSync(path)) return false;
    realpathSync(path);
    return true;
  } catch {
    return false;
  }
}

function brewPrefix(bin: string): string | undefined {
  try {
    return execFileSync(bin, ["--prefix"], { encoding: "utf8" }).trim();
  } catch {
    return undefined;
  }
}

/** Standalone binary installed by `npm` postinstall (`scripts/download-yt-dlp.mjs`). */
function projectBundledYtDlp(): string {
  const name = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  return join(cwd(), "bin", name);
}

/** Paths where yt-dlp often lives (GUI apps often omit Homebrew from PATH). */
function staticCandidates(): string[] {
  const list: string[] = [];
  const envPath = process.env.YT_DLP_PATH?.trim();
  if (envPath) list.push(envPath);

  list.push(projectBundledYtDlp());

  list.push(
    "/opt/homebrew/bin/yt-dlp",
    "/usr/local/bin/yt-dlp",
    join(homedir(), ".local", "bin", "yt-dlp")
  );

  const prefixes = [
    brewPrefix("/opt/homebrew/bin/brew"),
    brewPrefix("/usr/local/bin/brew"),
  ].filter(Boolean) as string[];

  for (const prefix of prefixes) {
    list.push(join(prefix, "bin", "yt-dlp"));
  }

  return list;
}

function enrichedPathEnv(): string {
  const parts = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    join(homedir(), ".local", "bin"),
    process.env.PATH ?? "",
  ];
  return parts.filter(Boolean).join(":");
}

function resolveViaShell(): string | undefined {
  try {
    if (process.platform === "win32") {
      const lines = execFileSync("where.exe", ["yt-dlp"], {
        encoding: "utf8",
      }).split(/\r?\n/);
      for (const line of lines) {
        const p = line.trim();
        if (p && isExecutableFile(p)) return p;
      }
      return undefined;
    }

    const out = execFileSync("/bin/sh", ["-lc", "command -v yt-dlp"], {
      encoding: "utf8",
      env: { ...process.env, PATH: enrichedPathEnv() },
    }).trim();

    if (out && isExecutableFile(out)) return out;
  } catch {
    /* ignore */
  }
  return undefined;
}

/** Login shell (e.g. bash -l) — matches what Terminal uses; GUI-spawned Node often has a tiny PATH. */
function resolveViaLoginShell(): string | undefined {
  if (process.platform === "win32") return undefined;
  try {
    const out = execFileSync("/bin/bash", ["-l", "-c", "command -v yt-dlp"], {
      encoding: "utf8",
      maxBuffer: 1024,
    }).trim();
    if (out && isExecutableFile(out)) return out;
  } catch {
    /* zsh user: try zsh -l */
    try {
      const out = execFileSync("/bin/zsh", ["-l", "-c", "command -v yt-dlp"], {
        encoding: "utf8",
        maxBuffer: 1024,
      }).trim();
      if (out && isExecutableFile(out)) return out;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

function resolveStandaloneBinary(): string | undefined {
  for (const p of staticCandidates()) {
    if (p && isExecutableFile(p)) return p;
  }

  const fromShell = resolveViaShell();
  if (fromShell) return fromShell;

  const fromLogin = resolveViaLoginShell();
  if (fromLogin) return fromLogin;

  return undefined;
}

/**
 * Prefer a real yt-dlp executable (Homebrew / PATH / `YT_DLP_PATH`).
 * The package default can invoke Python & hit "Python 3.10+ required" on older macOS CLT Python.
 */
export function getYoutubedl(): YoutubeDl {
  if (cached) return cached;
  const bin = resolveStandaloneBinary();
  if (bin) {
    cached = create(bin) as YoutubeDl;
    return cached;
  }
  if (process.platform === "linux" || process.platform === "win32") {
    throw new Error(
      "No standalone yt-dlp binary found. Staging/Linux images usually have no Python — run `npm install` so postinstall downloads bin/yt-dlp, or set YT_DLP_PATH to a standalone executable from https://github.com/yt-dlp/yt-dlp/releases ."
    );
  }
  if (process.platform === "darwin") {
    throw new Error(
      "No standalone yt-dlp found. Run `npm install` (installs bin/yt-dlp), or: brew install yt-dlp — then restart the dev server. You can also set YT_DLP_PATH. The npm default youtube-dl-exec bundle may require Python 3.10+."
    );
  }
  cached = defaultYtdl;
  return cached;
}
