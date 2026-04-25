// @vitest-environment jsdom
// Sprint 10 Phase 10.2 — audio adapter unit tests.
// Howler.js is mocked at the module level — jsdom can't actually play audio,
// and what we care about is that the adapter calls play() / fade() / volume()
// correctly given UI state, AND that all entry points are inert when not
// initialized (no throws, no Howler interactions).

import { beforeEach, describe, expect, test, vi } from 'vitest';

// Track Howl instances created so we can assert calls + capture onloaderror.
const howlInstances: MockHowl[] = [];

interface MockHowlConfig {
  src: string[];
  preload?: boolean;
  loop?: boolean;
  volume?: number;
  onloaderror?: (id: number, err: unknown) => void;
}

class MockHowl {
  src: string[];
  loop: boolean;
  _volume: number;
  played = 0;
  stopped = 0;
  unloaded = 0;
  fadeCalls: Array<{ from: number; to: number; ms: number }> = [];
  rateValue: number | null = null;
  fadeListeners: Array<() => void> = [];
  onloaderror: ((id: number, err: unknown) => void) | undefined;
  constructor(config: MockHowlConfig) {
    this.src = config.src;
    this.loop = config.loop ?? false;
    this._volume = config.volume ?? 1;
    this.onloaderror = config.onloaderror;
    howlInstances.push(this);
  }
  play(): number { this.played++; return 1; }
  stop(): this { this.stopped++; return this; }
  unload(): void { this.unloaded++; }
  volume(v?: number): number {
    if (typeof v === 'number') this._volume = v;
    return this._volume;
  }
  rate(v: number): this { this.rateValue = v; return this; }
  fade(from: number, to: number, ms: number): this {
    this.fadeCalls.push({ from, to, ms });
    return this;
  }
  once(_event: string, listener: () => void): this {
    this.fadeListeners.push(listener);
    return this;
  }
}

const muteCalls: boolean[] = [];

vi.mock('howler', () => ({
  Howl: MockHowl,
  Howler: { mute: (v: boolean) => { muteCalls.push(v); } },
}));

beforeEach(async () => {
  howlInstances.length = 0;
  muteCalls.length = 0;
  const { __resetAudioForTests } = await import('../../src/platform/audio');
  __resetAudioForTests();
  vi.resetModules();
});

describe('audio adapter — initAudio', () => {
  test('preloads 8 SFX + 3 ambient Howls', async () => {
    const { initAudio } = await import('../../src/platform/audio');
    initAudio();
    expect(howlInstances.length).toBe(11);
  });

  test('initAudio is idempotent', async () => {
    const { initAudio } = await import('../../src/platform/audio');
    initAudio();
    initAudio();
    initAudio();
    expect(howlInstances.length).toBe(11);
  });

  test('asset paths follow audioBasePath constant + GDD §28 filenames', async () => {
    const { initAudio } = await import('../../src/platform/audio');
    initAudio();
    const sources = howlInstances.flatMap((h) => h.src);
    expect(sources).toContain('/audio/tap.wav');
    expect(sources).toContain('/audio/prestige.wav');
    expect(sources).toContain('/audio/ambient_bio.mp3');
    expect(sources).toContain('/audio/ambient_digital.mp3');
    expect(sources).toContain('/audio/ambient_cosmic.mp3');
  });
});

describe('audio adapter — playSfx', () => {
  test('inert when not initialized (no throw)', async () => {
    const { playSfx } = await import('../../src/platform/audio');
    expect(() => playSfx('tap')).not.toThrow();
    expect(howlInstances.length).toBe(0);
  });

  test('plays the right Howl after init', async () => {
    const { initAudio, playSfx, setSfxVolume } = await import('../../src/platform/audio');
    initAudio();
    setSfxVolume(80); // above floor
    playSfx('discharge');
    const dischargeHowl = howlInstances.find((h) => h.src[0].endsWith('discharge.wav'))!;
    expect(dischargeHowl.played).toBe(1);
  });

  test('skips play when sfxVolume below floor (V-5 CPU saver)', async () => {
    const { initAudio, playSfx, setSfxVolume } = await import('../../src/platform/audio');
    initAudio();
    setSfxVolume(0);
    playSfx('discharge');
    const dischargeHowl = howlInstances.find((h) => h.src[0].endsWith('discharge.wav'))!;
    expect(dischargeHowl.played).toBe(0);
  });

  test('tap SFX gets pitch jitter via rate() (V-3 ±5%)', async () => {
    const { initAudio, playSfx, setSfxVolume } = await import('../../src/platform/audio');
    initAudio();
    setSfxVolume(80);
    playSfx('tap');
    const tapHowl = howlInstances.find((h) => h.src[0].endsWith('tap.wav'))!;
    expect(tapHowl.rateValue).not.toBeNull();
    expect(tapHowl.rateValue!).toBeGreaterThanOrEqual(0.95);
    expect(tapHowl.rateValue!).toBeLessThanOrEqual(1.05);
  });

  test('skipped if document hidden (AUDIO-2 muted state)', async () => {
    const { initAudio, playSfx, setSfxVolume, pauseAll } = await import('../../src/platform/audio');
    initAudio();
    setSfxVolume(80);
    pauseAll();
    playSfx('discharge');
    const dischargeHowl = howlInstances.find((h) => h.src[0].endsWith('discharge.wav'))!;
    expect(dischargeHowl.played).toBe(0);
  });

  test('broken SFX (load error) is skipped silently', async () => {
    const { initAudio, playSfx, setSfxVolume } = await import('../../src/platform/audio');
    initAudio();
    setSfxVolume(80);
    const dischargeHowl = howlInstances.find((h) => h.src[0].endsWith('discharge.wav'))!;
    dischargeHowl.onloaderror?.(0, 'simulated 404');
    playSfx('discharge');
    expect(dischargeHowl.played).toBe(0);
  });
});

describe('audio adapter — playAmbient + crossfade', () => {
  test('plays incoming era + sets crossfade fade()', async () => {
    const { initAudio, playAmbient, setMusicVolume } = await import('../../src/platform/audio');
    initAudio();
    setMusicVolume(60);
    playAmbient(1);
    const era1 = howlInstances.find((h) => h.src[0].endsWith('ambient_bio.mp3'))!;
    expect(era1.played).toBe(1);
    expect(era1.fadeCalls.length).toBeGreaterThan(0);
  });

  test('switching era fades out previous + fades in new', async () => {
    const { initAudio, playAmbient, setMusicVolume } = await import('../../src/platform/audio');
    initAudio();
    setMusicVolume(60);
    playAmbient(1);
    playAmbient(2);
    const era1 = howlInstances.find((h) => h.src[0].endsWith('ambient_bio.mp3'))!;
    const era2 = howlInstances.find((h) => h.src[0].endsWith('ambient_digital.mp3'))!;
    expect(era1.fadeCalls.some((c) => c.to === 0)).toBe(true);
    expect(era2.played).toBe(1);
  });

  test('same-era replay is no-op', async () => {
    const { initAudio, playAmbient, setMusicVolume } = await import('../../src/platform/audio');
    initAudio();
    setMusicVolume(60);
    playAmbient(2);
    playAmbient(2);
    const era2 = howlInstances.find((h) => h.src[0].endsWith('ambient_digital.mp3'))!;
    expect(era2.played).toBe(1); // not 2
  });
});

describe('audio adapter — volume sync', () => {
  test('setSfxVolume updates all SFX Howls', async () => {
    const { initAudio, setSfxVolume } = await import('../../src/platform/audio');
    initAudio();
    setSfxVolume(70);
    const sfxHowls = howlInstances.filter((h) => !h.loop);
    expect(sfxHowls.length).toBe(8);
    for (const h of sfxHowls) expect(h._volume).toBeCloseTo(0.7, 5);
  });

  test('setSfxVolume clamps to [0, 100]', async () => {
    const { initAudio, setSfxVolume } = await import('../../src/platform/audio');
    initAudio();
    setSfxVolume(250);
    const sfxHowls = howlInstances.filter((h) => !h.loop);
    for (const h of sfxHowls) expect(h._volume).toBe(1);
    setSfxVolume(-50);
    for (const h of sfxHowls) expect(h._volume).toBe(0);
  });

  test('setMusicVolume only updates currently-playing ambient', async () => {
    const { initAudio, playAmbient, setMusicVolume } = await import('../../src/platform/audio');
    initAudio();
    setMusicVolume(50);
    playAmbient(1);
    setMusicVolume(20);
    const era1 = howlInstances.find((h) => h.src[0].endsWith('ambient_bio.mp3'))!;
    const era2 = howlInstances.find((h) => h.src[0].endsWith('ambient_digital.mp3'))!;
    expect(era1._volume).toBeCloseTo(0.2, 5);
    // Era 2 not currently playing — unchanged from initial init volume (musicVolume at init time)
    expect(era2._volume).not.toBeCloseTo(0.2, 5);
  });
});

describe('audio adapter — AUDIO-2 visibility', () => {
  test('pauseAll calls Howler.mute(true)', async () => {
    const { initAudio, pauseAll } = await import('../../src/platform/audio');
    initAudio();
    pauseAll();
    expect(muteCalls.at(-1)).toBe(true);
  });

  test('resumeAll calls Howler.mute(false)', async () => {
    const { initAudio, pauseAll, resumeAll } = await import('../../src/platform/audio');
    initAudio();
    pauseAll();
    resumeAll();
    expect(muteCalls.at(-1)).toBe(false);
  });

  test('pauseAll/resumeAll inert when not initialized', async () => {
    const { pauseAll, resumeAll } = await import('../../src/platform/audio');
    expect(() => pauseAll()).not.toThrow();
    expect(() => resumeAll()).not.toThrow();
    expect(muteCalls.length).toBe(0);
  });
});
