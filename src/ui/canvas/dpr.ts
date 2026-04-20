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
  // canvas.clientWidth/Height is the authoritative CSS layout size — it reflects
  // the actual rendered area after accounting for Android nav bars, safe areas,
  // and any other system UI that reduces the WebView's usable height.
  // window.innerHeight can be larger than the canvas on devices with soft nav bars,
  // causing the neuron to draw at the wrong center and taps to miss.
  // Fall back to window.inner* only in jsdom (clientWidth = 0, no layout engine).
  const width = canvas.clientWidth > 0 ? canvas.clientWidth : window.innerWidth;
  const height = canvas.clientHeight > 0 ? canvas.clientHeight : window.innerHeight;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  // Reset any prior scaling, then apply new dpr scale so draw calls
  // stay in logical (CSS) pixel space.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  return { width, height, dpr };
}
