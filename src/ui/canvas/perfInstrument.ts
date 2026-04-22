/**
 * Dev-mode perf instrumentation for NeuronCanvas.
 *
 * Sprint 2 Phase 7. Attaches `window.__SYNAPSE_PERF__` under Vite's
 * `import.meta.env.DEV` flag so production builds carry no payload.
 *
 * Usage from DevTools (desktop or Mi A3 via chrome://inspect):
 *   window.__SYNAPSE_PERF__.startStress()  // inject 100-neuron state
 *   // wait 30s
 *   window.__SYNAPSE_PERF__.getReport()    // { avg, min, p5, frameCount, droppedFrames }
 *   window.__SYNAPSE_PERF__.stopStress()   // restore original neurons
 *
 * Public signatures are stable for scripts/perf-spike.ts (Playwright)
 * and Mi A3 manual runs — do not rename without updating both.
 */

import { useGameStore } from '../../store/gameStore';
import type { NeuronState } from '../../types';
import { createStressNeurons } from './stressState';
import { FPSMeter, type FPSReport } from './fpsMeter';

export interface PerfDevAPI {
  startStress: () => void;
  stopStress: () => void;
  getReport: () => FPSReport;
  resetMeter: () => void;
}

declare global {
  interface Window {
    __SYNAPSE_PERF__?: PerfDevAPI;
    __SYNAPSE_STORE__?: typeof useGameStore;
  }
}

export interface PerfInstrument {
  onFrame: (timestamp: number) => void;
  dispose: () => void;
}

/**
 * Install the window-level perf API and return a per-frame callback.
 * In non-DEV builds, returns a no-op instrument so callers don't need
 * branching. Safe to call unconditionally — no-op production overhead
 * is a single function-pointer indirection per frame.
 */
export function installPerfInstrument(): PerfInstrument {
  if (!import.meta.env.DEV) {
    return { onFrame: () => {}, dispose: () => {} };
  }

  const meter = new FPSMeter();
  let savedNeurons: NeuronState[] | null = null;

  const api: PerfDevAPI = {
    startStress: () => {
      if (savedNeurons !== null) return; // already stressed
      savedNeurons = useGameStore.getState().neurons;
      useGameStore.setState({ neurons: createStressNeurons() });
      meter.reset();
    },
    stopStress: () => {
      if (savedNeurons === null) return;
      useGameStore.setState({ neurons: savedNeurons });
      savedNeurons = null;
    },
    getReport: () => meter.report(),
    resetMeter: () => meter.reset(),
  };

  window.__SYNAPSE_PERF__ = api;
  window.__SYNAPSE_STORE__ = useGameStore;

  return {
    onFrame: (timestamp) => meter.frame(timestamp),
    dispose: () => {
      if (savedNeurons !== null) {
        useGameStore.setState({ neurons: savedNeurons });
      }
      delete window.__SYNAPSE_PERF__;
      delete window.__SYNAPSE_STORE__;
    },
  };
}
