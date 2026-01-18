"use client";

import { useEffect, useRef, useState } from "react";

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  const targetProgressRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const updateProgress = () => {
      const contentElement = document.getElementById("blog-content");
      if (!contentElement) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const contentTop = contentElement.offsetTop;
      const contentHeight = contentElement.offsetHeight;
      const contentBottom = contentTop + contentHeight;

      // Map scroll from start of page to content end
      const start = 0; // when scrollTop = 0, progress = 0
      const end = contentBottom - windowHeight; // when bottom of content reaches bottom of viewport, progress = 100

      const rawProgress = ((scrollTop - start) / (end - start)) * 100;
      targetProgressRef.current = Math.min(100, Math.max(0, rawProgress));
    };

    const animate = () => {
      setProgress((prev) => {
        const diff = targetProgressRef.current - prev;
        const step = diff * 0.1; // adjust speed (smaller = slower)
        return Math.abs(step) < 0.1 ? targetProgressRef.current : prev + step;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    updateProgress();
    animate();

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20">
      <div
        className="h-full bg-primary transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
