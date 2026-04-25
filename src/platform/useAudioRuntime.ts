// Sprint 10 Phase 10.2 — React glue for the Howler audio adapter.
//
// Single hook called from <App /> that:
//   - Initializes Howler at mount (deferred via setTimeout for AUDIO-1 — first
//     gesture has already unlocked AudioContext via NeuronCanvas's tap handler;
//     init is safe by then).
//   - Syncs Settings store volumes → adapter on change (V-5 floor handling
//     lives inside the adapter).
//   - Syncs `eraVisualTheme` → playAmbient(era) with crossfade.
//   - Wires AUDIO-2: visibilitychange → pauseAll / resumeAll.

import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  initAudio, pauseAll, playAmbient, resumeAll, setMusicVolume,
  setSfxVolume, type AmbientEra,
} from './audio';
import type { EraVisualTheme } from '../types';

function eraFromTheme(theme: EraVisualTheme): AmbientEra {
  if (theme === 'bioluminescent') return 1;
  if (theme === 'digital') return 2; // CONST-OK era index, not a tunable value
  return 3; // CONST-OK era index — 'cosmic'
}

export function useAudioRuntime(): void {
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const eraVisualTheme = useGameStore((s) => s.eraVisualTheme);

  // One-shot init at mount. Howler defers AudioContext resume to first
  // user gesture internally on suspended contexts; we additionally rely on
  // the tap handler that already calls unlockAudioOnFirstTap (Sprint 2).
  useEffect(() => {
    initAudio();
  }, []);

  useEffect(() => { setSfxVolume(sfxVolume); }, [sfxVolume]);
  useEffect(() => { setMusicVolume(musicVolume); }, [musicVolume]);

  useEffect(() => {
    playAmbient(eraFromTheme(eraVisualTheme));
  }, [eraVisualTheme]);

  // AUDIO-2 — pause everything while hidden, resume on visible.
  useEffect(() => {
    const onVis = (): void => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'hidden') pauseAll();
      else resumeAll();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
      return () => document.removeEventListener('visibilitychange', onVis);
    }
    return undefined;
  }, []);
}
