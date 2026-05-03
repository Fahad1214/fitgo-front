import { NextResponse } from "next/server";
import { existsSync } from "fs";
import { join } from "path";
import { cwd } from "process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bool(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export async function GET() {
  const cookieFile = process.env.YT_DLP_COOKIES_FILE?.trim() || null;
  const bundledYtDlp = join(cwd(), "bin", process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");

  return NextResponse.json({
    platform: process.platform,
    arch: process.arch,
    nodeEnv: process.env.NODE_ENV,
    hasYtDlpPath: bool("YT_DLP_PATH"),
    hasBundledYtDlp: existsSync(bundledYtDlp),
    cookieMode: bool("YT_DLP_COOKIES_BASE64")
      ? "base64"
      : bool("YT_DLP_COOKIES_TEXT")
        ? "text"
        : bool("YT_DLP_COOKIES_FILE")
          ? "file"
          : bool("YT_DLP_COOKIES_FROM_BROWSER")
            ? "browser"
            : "none",
    hasCookiesBase64: bool("YT_DLP_COOKIES_BASE64"),
    cookiesBase64Length: process.env.YT_DLP_COOKIES_BASE64?.trim().length ?? 0,
    hasCookiesText: bool("YT_DLP_COOKIES_TEXT"),
    hasCookiesFromBrowser: bool("YT_DLP_COOKIES_FROM_BROWSER"),
    hasCookiesFile: Boolean(cookieFile),
    cookiesFileExists: cookieFile ? existsSync(cookieFile) : false,
  });
}
