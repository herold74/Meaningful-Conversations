/** Convert hex (#RRGGBB) to space-separated RGB string "r g b" */
export function hexToRgb(hex: string): string {
  const h = hex.replace('#', '').trim();
  if (h.length !== 6) return '128 227 238'; // fallback cyan
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}
