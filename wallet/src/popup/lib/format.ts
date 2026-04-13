export function truncateMiddle(s: string, start = 4, end = 4): string {
  if (s.length <= start + end + 3) return s;
  return `${s.slice(0, start)}…${s.slice(-end)}`;
}
