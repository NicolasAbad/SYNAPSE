import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useSaveScheduler } from './store/saveScheduler';
import { useTickScheduler } from './store/tickScheduler';
import { NeuronCanvas } from './ui/canvas/NeuronCanvas';
import { HUD } from './ui/hud/HUD';

export function App() {
  // Sequential mount: load saved state first, then init timestamps ONLY if no
  // save was present. This prevents the Phase 7 Finding B race where the sync
  // mount effect could write mount-time timestamps before the async load
  // overwrote them. See PROGRESS.md Phase 7 Finding B.
  useEffect(() => {
    const initialize = async () => {
      const loaded = await useGameStore.getState().loadFromSave();
      if (!loaded) {
        useGameStore.getState().initSessionTimestamps(Date.now());
      }
      // If loaded === true: saved timestamps already present per
      // INIT-1 rule 3 (mount effect does NOT overwrite non-zero).
    };
    void initialize();
  }, []);

  useTickScheduler(); // game tick runtime (Phase 3.5 Finding #1 fix)
  useSaveScheduler();

  return (
    <main
      style={{
        margin: 0,
        padding: 0,
        height: '100%', // CONST-OK: CSS full-height idiom (CODE-1 exception)
        position: 'relative',
        background: 'var(--color-bg-deep, #05070d)', // CONST-OK: CSS fallback (CODE-1 exception)
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
        overflow: 'hidden',
      }}
    >
      <NeuronCanvas />
      <HUD />
    </main>
  );
}
