export function ellipsisBefore(s: string, index: number, maxLength: number): string {
  const start = Math.max(0, index - maxLength);
  const end = Math.min(index, start + maxLength);
  return (start != 0 ? '...' : '') + s.slice(start, end);
}

export function ellipsisAfter(s: string, index: number, maxLength: number): string {
  const start = index;
  const end = Math.min(s.length, start + maxLength);
  return s.slice(start, end) + (end != s.length ? '...' : '');
}
