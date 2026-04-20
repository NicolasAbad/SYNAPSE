/**
 * High-DPI canvas scaling helper.
 *
 * Sets the canvas pixel buffer to (cssWidth × dpr, cssHeight × dpr) so
 * lines and circles render at device-native resolution. The 2D context
 * is scaled by dpr so draw calls continue to use CSS (logical) pixels.
 *
 * Call on mount and on window resize. Returns the logical dimensions
 * for draw code to use.
 *
 * Implements CODE-4 "Canvas — rAF at 60fps... devicePixelRatio scaling".
 */

export interface LogicalDims {
  width: number;
  height: number;
  dpr: number;
}

export function setupHiDPICanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): LogicalDims {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  // Android WebView returns 0×0 for percentage-sized canvas at mount time —
  // fall back to window.innerWidth/Height which is always reliable.
  const width = rect.width || window.innerWidth;
  const height = rect.height || window.innerHeight;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  // Reset any prior scaling, then apply new dpr scale so draw calls
  // stay in logical (CSS) pixel space.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  return { width, height, dpr };
}
