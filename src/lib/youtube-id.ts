export function extractYoutubeId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);

    if (u.hostname === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id?.split("?")[0] ?? null;
    }

    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;

      const parts = u.pathname.split("/").filter(Boolean);
      const si = parts.indexOf("shorts");
      if (si >= 0 && parts[si + 1]) {
        return parts[si + 1].split("?")[0];
      }

      const ei = parts.indexOf("embed");
      if (ei >= 0 && parts[ei + 1]) {
        return parts[ei + 1].split("?")[0];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function isLikelyYoutubeUrl(input: string): boolean {
  return extractYoutubeId(input) !== null;
}
