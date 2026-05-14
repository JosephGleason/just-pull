export const MS_PER_DAY = 86_400_000;

export function toDate(s: string): Date {
  return new Date(s.slice(0, 10) + "T00:00:00Z");
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
