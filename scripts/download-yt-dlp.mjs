/**
 * Downloads the official standalone yt-dlp binary (no Python).
 * Required on Linux staging images that don't ship python3 (e.g. many serverless containers).
 *
 * Skip: SKIP_YT_DLP_DOWNLOAD=1
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const binDir = path.join(root, "bin");
const target = path.join(
  binDir,
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
);

if (process.env.SKIP_YT_DLP_DOWNLOAD === "1") {
  console.log("[yt-dlp] SKIP_YT_DLP_DOWNLOAD=1 — skipping download.");
  process.exit(0);
}

function assetFileName() {
  const p = process.platform;
  const a = process.arch;
  if (p === "linux") {
    if (a === "arm64") return "yt-dlp_linux_aarch64";
    if (a === "x64") return "yt-dlp_linux";
    if (a === "arm") return "yt-dlp_linux_armv7l";
  }
  if (p === "darwin") return "yt-dlp_macos";
  if (p === "win32") return "yt-dlp.exe";
  return null;
}

async function main() {
  const name = assetFileName();
  if (!name) {
    console.log(
      `[yt-dlp] No official standalone build mapped for ${process.platform}/${process.arch}; skipping.`
    );
    process.exit(0);
  }

  if (fs.existsSync(target)) {
    try {
      fs.accessSync(target, fs.constants.X_OK);
      console.log(`[yt-dlp] Already present: ${target}`);
      process.exit(0);
    } catch {
      /* re-download */
    }
  }

  const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${name}`;
  console.log(`[yt-dlp] Downloading ${url}`);

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    console.warn(
      `[yt-dlp] Download failed: ${res.status} ${res.statusText}. Set YT_DLP_PATH or SKIP_YT_DLP_DOWNLOAD=1.`
    );
    process.exit(0);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1_000_000) {
    console.warn(
      "[yt-dlp] Downloaded file looks too small; not writing. Check URL / release layout."
    );
    process.exit(0);
  }

  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(target, buf);
  if (process.platform !== "win32") {
    fs.chmodSync(target, 0o755);
  }

  console.log(`[yt-dlp] Installed standalone binary at ${target}`);
}

main().catch((err) => {
  console.warn("[yt-dlp] Postinstall error:", err.message);
  process.exit(0);
});
