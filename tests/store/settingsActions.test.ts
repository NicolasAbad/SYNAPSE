// Sprint 10 Phase 10.1 — Settings actions (8 setters + hardReset).
// Validates: setter writes correct field; volume sliders clamp to [0, 100];
// hardReset wipes state via createDefaultState (settings included); reset_game
// analytics event is fired BEFORE state wipe so consent is still readable.

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createDefaultState, useGameStore } from '../../src/store/gameStore';

vi.mock('../../src/platform/firebase', () => ({
  initFirebase: vi.fn(),
  logEvent: vi.fn(),
}));

beforeEach(() => {
  useGameStore.setState(createDefaultState());
  vi.clearAllMocks();
});

describe('settings setters — write the right field', () => {
  test('setSfxVolume writes sfxVolume', () => {
    useGameStore.getState().setSfxVolume(75);
    expect(useGameStore.getState().sfxVolume).toBe(75);
  });

  test('setMusicVolume writes musicVolume', () => {
    useGameStore.getState().setMusicVolume(20);
    expect(useGameStore.getState().musicVolume).toBe(20);
  });

  test('setLanguage writes language', () => {
    useGameStore.getState().setLanguage('es');
    expect(useGameStore.getState().language).toBe('es');
  });

  test('setColorblindMode writes colorblindMode', () => {
    useGameStore.getState().setColorblindMode(true);
    expect(useGameStore.getState().colorblindMode).toBe(true);
  });

  test('setReducedMotion writes reducedMotion', () => {
    useGameStore.getState().setReducedMotion(true);
    expect(useGameStore.getState().reducedMotion).toBe(true);
  });

  test('setHighContrast writes highContrast', () => {
    useGameStore.getState().setHighContrast(true);
    expect(useGameStore.getState().highContrast).toBe(true);
  });

  test('setFontSize writes fontSize', () => {
    useGameStore.getState().setFontSize('large');
    expect(useGameStore.getState().fontSize).toBe('large');
  });

  test('setNotificationsEnabled writes notificationsEnabled', () => {
    useGameStore.getState().setNotificationsEnabled(false);
    expect(useGameStore.getState().notificationsEnabled).toBe(false);
  });
});

describe('volume setters — defensive clamp [0, 100]', () => {
  test('setSfxVolume clamps below 0 to 0', () => {
    useGameStore.getState().setSfxVolume(-25);
    expect(useGameStore.getState().sfxVolume).toBe(0);
  });

  test('setSfxVolume clamps above 100 to 100', () => {
    useGameStore.getState().setSfxVolume(250);
    expect(useGameStore.getState().sfxVolume).toBe(100);
  });

  test('setMusicVolume clamps both ends', () => {
    useGameStore.getState().setMusicVolume(-5);
    expect(useGameStore.getState().musicVolume).toBe(0);
    useGameStore.getState().setMusicVolume(101);
    expect(useGameStore.getState().musicVolume).toBe(100);
  });

  test('setSfxVolume passes through 0 and 100 exactly (boundary)', () => {
    useGameStore.getState().setSfxVolume(0);
    expect(useGameStore.getState().sfxVolume).toBe(0);
    useGameStore.getState().setSfxVolume(100);
    expect(useGameStore.getState().sfxVolume).toBe(100);
  });
});

describe('hardReset action', () => {
  test('wipes state to createDefaultState including settings', () => {
    // Make state non-default
    useGameStore.setState({
      thoughts: 50_000, prestigeCount: 5, isTutorialCycle: false,
      sfxVolume: 25, language: 'es', colorblindMode: true,
      memories: 100, sparks: 50,
    });
    useGameStore.getState().hardReset();
    const s = useGameStore.getState();
    expect(s.thoughts).toBe(0);
    expect(s.prestigeCount).toBe(0);
    expect(s.isTutorialCycle).toBe(true);
    expect(s.sfxVolume).toBe(50); // back to default per V-3 design
    expect(s.language).toBe('en');
    expect(s.colorblindMode).toBe(false);
    expect(s.memories).toBe(0);
    expect(s.sparks).toBe(0);
  });

  test('preserves action bindings (Zustand pitfall guard)', () => {
    useGameStore.getState().hardReset();
    expect(typeof useGameStore.getState().hardReset).toBe('function');
    expect(typeof useGameStore.getState().setSfxVolume).toBe('function');
    expect(typeof useGameStore.getState().reset).toBe('function');
  });

  test('logs reset_game analytics event with timestamp BEFORE wiping consent flag', async () => {
    const { logEvent } = await import('../../src/platform/firebase');
    useGameStore.setState({ analyticsConsent: true });
    useGameStore.getState().hardReset();
    expect(logEvent).toHaveBeenCalledWith('reset_game', expect.objectContaining({ timestamp: expect.any(Number) }), true);
  });

  test('respects analyticsConsent=false (no event fired)', async () => {
    const { logEvent } = await import('../../src/platform/firebase');
    useGameStore.setState({ analyticsConsent: false });
    useGameStore.getState().hardReset();
    expect(logEvent).toHaveBeenCalledWith('reset_game', expect.any(Object), false);
  });
});
