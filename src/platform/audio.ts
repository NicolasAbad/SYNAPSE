// Implements docs/GDD.md §28 (Audio) — Sprint 10 Phase 10.2.
//
// Howler.js adapter exposing playSfx(name) + playAmbient(eraN) + volume
// sync + AUDIO-1 (gesture-unlock — already wired in audioUnlock.ts) +
// AUDIO-2 (visibilitychange pause).
//
// Asset paths (V-1): public/audio/{name}.{mp3|wav} bundled by Vite/Capacitor.
// 404 / decode errors (V-2): logged in dev, silent in prod, never throw.
// Volume floor (V-5): skip play() when slider is below `audioVolumeFloorPct`.
// Tap pitch jitter (V-3): ±5% Math.random — UI side-effect only, not engine.
// Era crossfade (V-4): tracked by `currentAmbient` + Howler `fade()`.

import { Howl, Howler } from 'howler';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import { AMBIENT_SPECS, SFX_SPECS, type AmbientEra, type SfxName } from '../config/audio';

export type { SfxName, AmbientEra } from '../config/audio';

const sfxHowls = new Map<SfxName, Howl>();
const ambientHowls = new Map<AmbientEra, Howl>();
const brokenSfx = new Set<SfxName>();
const brokenAmbient = new Set<AmbientEra>();
let currentAmbient: AmbientEra | null = null;
let sfxVolume = 0.5; // CONST-OK 0-1 default before first sync from settings
let musicVolume = 0.5; // CONST-OK 0-1 default before first sync from settings
let audioVisible = true;
let initialized = false;

function pctToVolume(pct: number): number {
  return Math.max(0, Math.min(100, pct)) / 100; // CONST-OK 0-100 → 0-1 for Howler (UI slider domain → audio API domain)
}

function isAboveFloor(volume: number): boolean {
  return volume * 100 > SYNAPSE_CONSTANTS.audioVolumeFloorPct; // CONST-OK 0-1 → 0-100 unit conversion
}

function logDev(msg: string, err?: unknown): void {
  if (import.meta.env.DEV) console.warn(`[audio] ${msg}`, err ?? '');
}

/** Idempotent. Preloads all SFX + ambient Howl instances. Safe under SSR / jsdom (skips). */
export function initAudio(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  for (const spec of SFX_SPECS) {
    const howl = new Howl({
      src: [`${SYNAPSE_CONSTANTS.audioBasePath}/${spec.file}`],
      preload: true,
      volume: sfxVolume,
      onloaderror: (_id, err) => { brokenSfx.add(spec.name); logDev(`SFX ${spec.name} failed to load`, err); },
    });
    sfxHowls.set(spec.name, howl);
  }
  for (const spec of AMBIENT_SPECS) {
    const howl = new Howl({
      src: [`${SYNAPSE_CONSTANTS.audioBasePath}/${spec.file}`],
      preload: true,
      loop: true,
      volume: musicVolume,
      onloaderror: (_id, err) => { brokenAmbient.add(spec.era); logDev(`Ambient era ${spec.era} failed to load`, err); },
    });
    ambientHowls.set(spec.era, howl);
  }
  initialized = true;
}

export function playSfx(name: SfxName): void {
  if (!initialized || !audioVisible) return;
  if (!isAboveFloor(sfxVolume)) return;
  if (brokenSfx.has(name)) return;
  const howl = sfxHowls.get(name);
  if (!howl) return;
  try {
    if (name === 'tap') {
      const range = SYNAPSE_CONSTANTS.tapSfxRateMax - SYNAPSE_CONSTANTS.tapSfxRateMin;
      const rate = SYNAPSE_CONSTANTS.tapSfxRateMin + Math.random() * range;
      howl.rate(rate);
    }
    howl.play();
  } catch (e) {
    logDev(`playSfx ${name} threw`, e);
  }
}

export function playAmbient(era: AmbientEra): void {
  if (!initialized) return;
  if (currentAmbient === era) return;
  if (brokenAmbient.has(era)) return;
  const incoming = ambientHowls.get(era);
  if (!incoming) return;
  try {
    if (currentAmbient !== null) {
      const outgoing = ambientHowls.get(currentAmbient);
      if (outgoing) {
        outgoing.fade(outgoing.volume(), 0, SYNAPSE_CONSTANTS.ambientCrossfadeMs);
        outgoing.once('fade', () => outgoing.stop());
      }
    }
    incoming.volume(0);
    if (audioVisible && isAboveFloor(musicVolume)) incoming.play();
    incoming.fade(0, musicVolume, SYNAPSE_CONSTANTS.ambientCrossfadeMs);
    currentAmbient = era;
  } catch (e) {
    logDev(`playAmbient era ${era} threw`, e);
  }
}

export function stopAmbient(): void {
  if (!initialized || currentAmbient === null) return;
  const outgoing = ambientHowls.get(currentAmbient);
  if (outgoing) {
    try { outgoing.stop(); } catch (e) { logDev('stopAmbient threw', e); }
  }
  currentAmbient = null;
}

export function setSfxVolume(pct: number): void {
  sfxVolume = pctToVolume(pct);
  if (!initialized) return;
  for (const howl of sfxHowls.values()) {
    try { howl.volume(sfxVolume); } catch (e) { logDev('setSfxVolume per-howl threw', e); }
  }
}

export function setMusicVolume(pct: number): void {
  musicVolume = pctToVolume(pct);
  if (!initialized || currentAmbient === null) return;
  const howl = ambientHowls.get(currentAmbient);
  if (howl) {
    try { howl.volume(musicVolume); } catch (e) { logDev('setMusicVolume current threw', e); }
  }
}

/** Pause everything when document.hidden — implements GDD §28 visibility rule. */
export function pauseAll(): void {
  audioVisible = false;
  if (!initialized) return;
  try { Howler.mute(true); } catch (e) { logDev('pauseAll mute threw', e); }
}

export function resumeAll(): void {
  audioVisible = true;
  if (!initialized) return;
  try { Howler.mute(false); } catch (e) { logDev('resumeAll unmute threw', e); }
}

/** Test-only — wipe module state between tests. */
export function __resetAudioForTests(): void {
  for (const howl of sfxHowls.values()) {
    try { howl.unload(); } catch { /* swallow */ }
  }
  for (const howl of ambientHowls.values()) {
    try { howl.unload(); } catch { /* swallow */ }
  }
  sfxHowls.clear();
  ambientHowls.clear();
  brokenSfx.clear();
  brokenAmbient.clear();
  currentAmbient = null;
  sfxVolume = 0.5; // CONST-OK 0-1 default mirrors module init
  musicVolume = 0.5; // CONST-OK 0-1 default mirrors module init
  audioVisible = true;
  initialized = false;
}
