/**
 * Wrap text to fit within maxWidth using Canvas2D measurement.
 *
 * Splits input on whitespace, greedily packs words per line using
 * `ctx.measureText()`. A single word wider than `maxWidth` is placed
 * alone on its own line (no mid-word break — callers truncate if
 * needed).
 *
 * SPRINTS.md §Sprint 2 AI check: `wrapText(ctx, "long string", maxWidth)`
 * splits correctly.
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (text === '') return [];
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}
