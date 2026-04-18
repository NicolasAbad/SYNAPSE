import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useSaveScheduler } from './store/saveScheduler';
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

  useSaveScheduler();

  // Phase 3 placeholder readout — Phase 5 replaces with real HUD (thoughts TL, rate TR, etc).
  const thoughts = useGameStore((s) => s.thoughts);

  return (
    <main
      style={{
        margin: 0,
        padding: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-deep)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <header
        style={{
          padding: 'var(--spacing-4)', // CONST-OK: CSS custom property ref (CODE-1 exception)
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 'var(--spacing-4)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        }}
      >
        <h1 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>SYNAPSE</h1>
        <div
          data-testid="thoughts-readout"
          style={{
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--color-thoughts-counter)',
            fontWeight: 'var(--font-weight-bold)',
          }}
        >
          Thoughts: {Math.floor(thoughts)}
        </div>
      </header>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <NeuronCanvas />
      </div>
      {/* HUD + TabBar come in later phases */}
    </main>
  );
}
