import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useSaveScheduler } from './store/saveScheduler';
import { useTickScheduler } from './store/tickScheduler';
import { NeuronCanvas } from './ui/canvas/NeuronCanvas';

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

  // Phase 3 placeholder readout — Phase 5 replaces with real HUD (thoughts TL, rate TR, etc).
  const thoughts = useGameStore((s) => s.thoughts);

  return (
    <main
      style={{
        margin: 0,
        padding: 0,
        height: '100vh',
        position: 'relative',
        background: 'var(--color-bg-deep)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
        overflow: 'hidden',
      }}
    >
      <NeuronCanvas />
      {/* Thoughts readout — top-left amber monospace per UI_MOCKUPS canvas section.
          Absolute-positioned over the canvas. Placeholder until the full HUD ships. */}
      <div
        data-testid="thoughts-readout"
        style={{
          position: 'absolute',
          top: 'var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
          left: 'var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
          color: 'var(--color-thoughts-counter)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-weight-black)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          pointerEvents: 'none',
        }}
      >
        {Math.floor(thoughts).toLocaleString()}
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--color-text-secondary)',
            marginTop: 'var(--spacing-1)', // CONST-OK: CSS custom property ref (CODE-1 exception)
          }}
        >
          thoughts
        </div>
      </div>
    </main>
  );
}
