import { useGameStore } from '@/store/gameStore';
import { getActiveTheme } from './themes';
import { getActiveSkin, layoutNodes, drawNeurons } from './nodes';
import { getActiveGlowPack, drawConnections } from './connections';
import { drawDischargeFlash } from './effects';

interface RendererHandle {
  stop: () => void;
}

function setupRetina(canvas: HTMLCanvasElement): { width: number; height: number } {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  const ctx = canvas.getContext('2d');
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

export function startRenderer(canvas: HTMLCanvasElement): RendererHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  let { width, height } = setupRetina(canvas);
  let rafId = 0;
  let paused = false;
  const startTime = performance.now();

  const onResize = (): void => {
    const dims = setupRetina(canvas);
    width = dims.width;
    height = dims.height;
  };

  const onVisibility = (): void => {
    paused = document.visibilityState === 'hidden';
    if (!paused) rafId = requestAnimationFrame(frame);
  };

  function frame(): void {
    if (paused) return;
    const time = performance.now() - startTime;
    const state = useGameStore.getState();
    const theme = getActiveTheme(state);
    const skin = getActiveSkin(state);
    const glow = getActiveGlowPack(state);

    theme.background(ctx!, width, height, time);
    theme.particleEffect(ctx!, width, height, time);

    const nodes = layoutNodes(state.neurons, width, height);
    drawConnections(ctx!, nodes, theme, skin, glow, time);
    drawNeurons(ctx!, nodes, theme, skin, time);

    const flashAge = Date.now() - state.dischargeLastTimestamp;
    drawDischargeFlash(ctx!, width, height, flashAge);

    rafId = requestAnimationFrame(frame);
  }

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  rafId = requestAnimationFrame(frame);

  return {
    stop(): void {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
