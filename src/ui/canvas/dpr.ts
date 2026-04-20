/**
 * High-DPI canvas scaling helper.
 *
 * Sets the canvas pixel buffer to (cssWidth × dpr, cssHeight × dpr) so
 * lines and circles render at device-native resolution. The 2D context
 * is scaled by dpr so draw calls continue to use CSS (logical) pixels.
 *
 * Two entry points:
 * - setupHiDPICanvas: uses window.innerWidth/Height for the initial mount
 *   call (before layout has settled; ResizeObserver corrects within one frame).
 * - resizeHiDPICanvas: accepts explicit width/height from a ResizeObserver
 *   contentRect — the authoritative CSS layout size that accounts for Android
 *   nav bars, safe areas, and other system UI that reduce the usable viewport.
 *
 * Implements CODE-4 "Canvas — rAF at 60fps... devicePixelRatio scaling".
 */

export interface LogicalDims {
  width: number;
  height: number;
  dpr: number;
}

function applyDPR(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): LogicalDims {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  // Explicitly pin CSS display size so the canvas never uses its pixel-buffer
  // as intrinsic CSS size — observed on Android WebView when parent height = 0
  // (height chain: html→body→#root→main collapses), which caused the canvas to
  // render at 2× the viewport in CSS pixels and cover the dark background.
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  return { width, height, dpr };
}

export function setupHiDPICanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): LogicalDims {
  // window.innerWidth/Height can return 0 on Android WebView when the
  // activity is in the background or the viewport hasn't been laid out yet
  // (observed on Mi A3, Chrome 127). screen.width/height is always non-zero
  // on real devices and serves as a valid fallback — ResizeObserver corrects
  // to the exact contentRect within the first visible frame.
  const width = window.innerWidth || screen.width;
  const height = window.innerHeight || screen.height;
  return applyDPR(canvas, ctx, width, height);
}

export function resizeHiDPICanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): LogicalDims {
  // width/height come from ResizeObserver entry.contentRect — the exact CSS
  // layout dimensions after accounting for all system UI insets.
  return applyDPR(canvas, ctx, width, height);
}
