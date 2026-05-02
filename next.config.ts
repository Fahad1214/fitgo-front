import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Include standalone yt-dlp from postinstall in serverless bundle (Vercel/staging). */
  outputFileTracingIncludes: {
    "/api/youtube-shorts/generate": ["./bin/yt-dlp", "./bin/yt-dlp.exe"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.prismic.io",
      },
    ],
  },
  serverExternalPackages: [
    "archiver",
    "fluent-ffmpeg",
    "youtube-dl-exec",
    "@ffmpeg-installer/ffmpeg",
    "@ffprobe-installer/ffprobe",
  ],
};

export default nextConfig;
