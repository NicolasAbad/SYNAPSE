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
      <h1
        style={{
          padding: 'var(--spacing-4)',
          margin: 0,
          fontSize: 'var(--text-xl)',
        }}
      >
        SYNAPSE
      </h1>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <NeuronCanvas />
      </div>
      {/* HUD + TabBar come in later phases */}
    </main>
  );
}
