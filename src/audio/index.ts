import { Howler, Howl } from 'howler';

type SfxKey = 'tap' | 'buy' | 'discharge' | 'cascade' | 'prestige' | 'unlock';

const SFX_REGISTRY: Partial<Record<SfxKey, Howl>> = {};

let unlocked = false;

export function unlockAudioContext(): void {
  if (unlocked) return;
  Howler.ctx?.resume();
  unlocked = true;
}

export function registerSfx(key: SfxKey, url: string): void {
  SFX_REGISTRY[key] = new Howl({ src: [url], preload: true });
}

export function playSfx(key: SfxKey): void {
  if (!unlocked) return;
  SFX_REGISTRY[key]?.play();
}
