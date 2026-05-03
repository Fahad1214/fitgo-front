'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import JSZip from 'jszip';
import { Loader2, Download, Film } from 'lucide-react';
import {
  clampClipCount,
  DEFAULT_SHORTS_CLIP_COUNT,
  MAX_SHORTS_CLIP_COUNT,
} from '@/lib/shorts-segments';

const LOADING_MESSAGES = [
  'Hang tight — we are downloading and trimming your clips.',
  'Be patient — this can take a minute for longer videos.',
  'Working on it… ffmpeg is doing its magic.',
  'Almost there — cropping to 9:16 and adding the blurred frame.',
  'Still going — grabbing the best moments across your timeline.',
  'Thanks for waiting — encoding takes a bit of CPU.',
  'Processing — yt-dlp and ffmpeg are on the job.',
  'Good things take time — your shorts are worth it.',
  'One moment — wrapping everything into your ZIP.',
];

function pickLoadingMessage(exclude?: string): string {
  if (LOADING_MESSAGES.length === 0) return '';
  let msg =
    LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]!;
  if (exclude && LOADING_MESSAGES.length > 1 && msg === exclude) {
    const i = LOADING_MESSAGES.indexOf(msg);
    msg = LOADING_MESSAGES[(i + 1) % LOADING_MESSAGES.length]!;
  }
  return msg;
}

function getShortsApiBase(): string {
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  ) {
    return '';
  }

  const raw = process.env.NEXT_PUBLIC_SHORTS_API_BASE_URL?.trim();
  if (!raw) return '';
  const withoutTrailingSlash = raw.replace(/\/$/, '');
  return /^https?:\/\//i.test(withoutTrailingSlash)
    ? withoutTrailingSlash
    : `https://${withoutTrailingSlash}`;
}

export default function VideosToShortsPage() {
  const [url, setUrl] = useState('');
  /** String so users can type freely (e.g. "10") without per-keystroke clamping. */
  const [clipCountInput, setClipCountInput] = useState(
    String(DEFAULT_SHORTS_CLIP_COUNT)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [clipUrls, setClipUrls] = useState<string[]>([]);
  const [metaTitle, setMetaTitle] = useState<string | null>(null);
  const [loadingTip, setLoadingTip] = useState('');

  useEffect(() => {
    return () => {
      clipUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [clipUrls]);

  useEffect(() => {
    if (!loading) {
      setLoadingTip('');
      return;
    }
    const id = setInterval(() => {
      setLoadingTip((prev) => pickLoadingMessage(prev));
    }, 4200);
    return () => clearInterval(id);
  }, [loading]);

  const downloadZip = useCallback(() => {
    if (!zipBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = 'fitgo-shorts.zip';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [zipBlob]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setZipBlob(null);
    setMetaTitle(null);
    clipUrls.forEach((u) => URL.revokeObjectURL(u));
    setClipUrls([]);

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Paste a YouTube link first.');
      return;
    }

    setLoading(true);
    setLoadingTip(pickLoadingMessage());
    try {
      const safeCount = clampClipCount(clipCountInput);
      setClipCountInput(String(safeCount));

      const apiBase = getShortsApiBase();
      const res = await fetch(`${apiBase}/api/youtube-shorts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, clipCount: safeCount }),
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        let message = '';
        if (contentType.includes('application/json')) {
          const data = (await res.json().catch(() => ({}))) as { message?: string };
          message = data.message || '';
        } else {
          message = await res.text().catch(() => '');
        }

        throw new Error(
          message
            ? `Could not create shorts (${res.status}): ${message.slice(0, 1000)}`
            : `Could not create shorts (${res.status}). Check Railway logs for the full server error.`
        );
      }

      const blob = await res.blob();
      setZipBlob(blob);

      const zip = await JSZip.loadAsync(blob);
      let generatedCount = safeCount;
      const jsonFile = zip.file('clips-info.json');
      if (jsonFile) {
        const raw = await jsonFile.async('string');
        try {
          const meta = JSON.parse(raw) as {
            title?: string | null;
            clipCount?: number;
          };
          if (meta.title) setMetaTitle(meta.title);
          if (
            typeof meta.clipCount === 'number' &&
            meta.clipCount >= 1 &&
            meta.clipCount <= MAX_SHORTS_CLIP_COUNT
          ) {
            generatedCount = meta.clipCount;
          }
        } catch {
          /* ignore */
        }
      }

      const nextUrls: string[] = [];
      for (let i = 1; i <= generatedCount; i++) {
        const f = zip.file(`short-${i}.mp4`);
        if (!f) continue;
        const buf = await f.async('arraybuffer');
        nextUrls.push(
          URL.createObjectURL(new Blob([buf], { type: 'video/mp4' }))
        );
      }
      setClipUrls(nextUrls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
     
      <div className="max-w-5xl mx-auto">
      <Link
          href="/"
          className="inline-flex mb-10 items-center text-orange-600 font-semibold hover:text-orange-700 mt-6"
        >
          ← Back to home
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Videos to Shorts
        </h1>
        <p className="text-gray-600 mb-8 max-w-2xl">
          Paste a YouTube URL and choose how many shorts to generate (default 1, up to{' '}
          {MAX_SHORTS_CLIP_COUNT}). We download once, spread clips across the timeline, and
          format each in a 9:16 frame with a blurred fill so landscape shots are not harshly
          cropped. You get a ZIP of MP4s.
        </p>

        <form onSubmit={handleCreate} className="space-y-4 mb-12">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              name="youtube-url"
              autoComplete="off"
              placeholder="https://www.youtube.com/watch?v=…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-60 disabled:pointer-events-none transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating shorts…
                </>
              ) : (
                <>
                  <Film className="w-5 h-5" />
                  Create shorts
                </>
              )}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Number of shorts
            </label>
            <input
              type="text"
              inputMode="numeric"
              name="clip-count"
              autoComplete="off"
              maxLength={2}
              aria-label="Number of shorts"
              placeholder="1"
              value={clipCountInput}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, "");
                if (digitsOnly === "") {
                  setClipCountInput("");
                  return;
                }
                const n = parseInt(digitsOnly, 10);
                if (!Number.isFinite(n)) {
                  setClipCountInput("");
                  return;
                }
                const clamped = Math.min(MAX_SHORTS_CLIP_COUNT, n);
                setClipCountInput(String(clamped));
              }}
              onBlur={() => {
                const v = clampClipCount(
                  clipCountInput === "" ? undefined : clipCountInput
                );
                setClipCountInput(String(v));
              }}
              className="w-12 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none"
              disabled={loading}
            />
            <span className="text-sm text-gray-500">(1–{MAX_SHORTS_CLIP_COUNT})</span>
          </div>
          {loading && loadingTip ? (
            <p
              className="text-sm text-gray-600 border-l-2 border-orange-400 pl-3 py-2 bg-orange-50/60 rounded-r-lg max-w-2xl"
              key={loadingTip}
              role="status"
              aria-live="polite"
            >
              {loadingTip}
            </p>
          ) : null}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {error}
            </p>
          )}
        </form>

        {(metaTitle || clipUrls.length > 0) && (
          <div className="mb-8">
            {metaTitle && (
              <p className="text-gray-700 font-medium mb-4 truncate" title={metaTitle}>
                {metaTitle}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                type="button"
                onClick={downloadZip}
                disabled={!zipBlob}
                className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 hover:bg-orange-100 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Download ZIP
              </button>
            </div>

            <div
              className={`grid gap-8 justify-items-center ${
                clipUrls.length <= 1
                  ? 'grid-cols-1 max-w-[260px] mx-auto w-full'
                  : clipUrls.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {clipUrls.map((src, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3 w-full max-w-[260px]">
                  <p className="text-sm font-semibold text-gray-500">Short {idx + 1}</p>
                  <div className="relative w-full aspect-[9/16] max-h-[520px] rounded-[2rem] border-[10px] border-gray-900 bg-black shadow-2xl overflow-hidden ring-1 ring-black/20">
                    <video
                      src={src}
                      className="absolute inset-0 h-full w-full object-cover"
                      controls
                      playsInline
                      preload="metadata"
                    />
                  </div>
                  <a
                    href={src}
                    download={`short-${idx + 1}.mp4`}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Download this clip
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
