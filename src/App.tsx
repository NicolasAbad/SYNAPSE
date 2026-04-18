import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useSaveScheduler } from './store/saveScheduler';

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

  const thoughts = useGameStore((s) => s.thoughts);
  return (
    <main style={{ fontFamily: 'system-ui', padding: 16 }}>
      <h1>SYNAPSE</h1>
      <p>Thoughts: {Math.floor(thoughts)}</p>
    </main>
  );
}
