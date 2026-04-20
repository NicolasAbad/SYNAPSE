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
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  return { width, height, dpr };
}

export function setupHiDPICanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): LogicalDims {
  // Use window.innerWidth/Height at initial mount. ResizeObserver fires within
  // the first frame and calls resizeHiDPICanvas with entry.contentRect to
  // correct any nav-bar / safe-area mismatch on Android devices.
  return applyDPR(canvas, ctx, window.innerWidth, window.innerHeight);
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
