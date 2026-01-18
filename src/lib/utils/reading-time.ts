export function formatReadingTime(minutes: number | null | undefined): string {
  if (!minutes || minutes === 0) return "";
  if (minutes === 1) return "1 min read";
  return `${minutes} min read`;
}
