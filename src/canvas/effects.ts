import { DISCHARGE_FLASH_COLOR } from '@/config/colorPalettes';

const DISCHARGE_DURATION_MS = 500;
const NARRATIVE_FONT = "italic 13px Georgia, 'Times New Roman', serif";

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawDischargeFlash(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  ageMs: number,
): void {
  if (ageMs < 0 || ageMs > DISCHARGE_DURATION_MS) return;
  const t = ageMs / DISCHARGE_DURATION_MS;
  const alpha = (1 - t) * 0.4;
  ctx.save();
  const grad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) / 1.5,
  );
  grad.addColorStop(0, DISCHARGE_FLASH_COLOR + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
  grad.addColorStop(1, DISCHARGE_FLASH_COLOR + '00');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function drawNarrativeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  opacity: number,
): void {
  ctx.save();
  ctx.font = NARRATIVE_FONT;
  ctx.fillStyle = `rgba(232, 230, 248, ${opacity})`;
  ctx.textAlign = 'center';
  const lines = wrapText(ctx, text, width * 0.8);
  const startY = height * 0.72;
  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * 18);
  });
  ctx.restore();
}
