// Minimal HTMLCanvasElement 2D context mock for jsdom.
// jsdom ships HTMLCanvasElement but getContext('2d') returns null unless
// node-canvas (native) is installed. For Sprint 2 Phase 2 structural tests
// we don't need pixel fidelity — a stub context that satisfies the API
// surface called by dpr/glowCache/renderer is sufficient.
//
// Applies only in jsdom-environment tests (guarded by typeof check).
// Real-Chromium rendering verification is deferred to Vitest Browser Mode
// in a later phase (Phase 5 HUD tests per Sprint 2 checklist).

if (typeof HTMLCanvasElement !== 'undefined') {
  const makeStubContext = (): CanvasRenderingContext2D =>
    ({
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      globalAlpha: 1,
      setTransform() {},
      scale() {},
      translate() {},
      rotate() {},
      save() {},
      restore() {},
      clearRect() {},
      fillRect() {},
      strokeRect() {},
      beginPath() {},
      closePath() {},
      moveTo() {},
      lineTo() {},
      arc() {},
      fill() {},
      stroke() {},
      drawImage() {},
      measureText() {
        return { width: 0 } as TextMetrics;
      },
      createRadialGradient() {
        return { addColorStop() {} } as CanvasGradient;
      },
      createLinearGradient() {
        return { addColorStop() {} } as CanvasGradient;
      },
    }) as unknown as CanvasRenderingContext2D;

  HTMLCanvasElement.prototype.getContext = function () {
    return makeStubContext();
  } as unknown as HTMLCanvasElement['getContext'];
}
