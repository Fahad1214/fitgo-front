/** Default and cap for the “how many shorts” control (API + UI should stay in sync). */
export const DEFAULT_SHORTS_CLIP_COUNT = 1;
export const MAX_SHORTS_CLIP_COUNT = 10;

/**
 * Evenly spread `clipCount` non-overlapping windows across the video (vertical shorts length).
 */
export function computeShortsSegments(
  durationSec: number,
  clipCount: number
): { start: number; len: number }[] {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new Error("Invalid video duration");
  }

  const n = Math.min(
    MAX_SHORTS_CLIP_COUNT,
    Math.max(1, Math.floor(clipCount))
  );

  const maxClip = 45;
  const minClip = 8;

  let clipLen = Math.min(maxClip, Math.max(minClip, durationSec / (n + 0.5)));
  if (clipLen * n > durationSec) {
    clipLen = durationSec / n;
  }

  const slack = Math.max(0, durationSec - clipLen * n);
  const pad = slack / (n + 1);

  const segments: { start: number; len: number }[] = [];
  for (let i = 0; i < n; i++) {
    const start = pad * (i + 1) + clipLen * i;
    segments.push({ start, len: clipLen });
  }
  return segments;
}

export function clampClipCount(raw: unknown): number {
  const n =
    typeof raw === "number" && Number.isFinite(raw)
      ? Math.floor(raw)
      : typeof raw === "string" && raw.trim() !== ""
        ? parseInt(raw, 10)
        : NaN;
  if (!Number.isFinite(n)) return DEFAULT_SHORTS_CLIP_COUNT;
  return Math.min(MAX_SHORTS_CLIP_COUNT, Math.max(1, n));
}
