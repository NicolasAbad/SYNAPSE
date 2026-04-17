import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useInitSession } from './store/initSession';
import { useSaveScheduler } from './store/saveScheduler';

export function App() {
  // Load saved state before INIT-1 populates timestamps. If a save exists,
  // its saved timestamps (non-zero) will block the mount effect from
  // overwriting them per INIT-1 rule 3. If no save, mount populates from Date.now().
  useEffect(() => {
    void useGameStore.getState().loadFromSave();
  }, []);
  useInitSession();
  useSaveScheduler();
  const thoughts = useGameStore((s) => s.thoughts);
  return (
    <main style={{ fontFamily: 'system-ui', padding: 16 }}>
      <h1>SYNAPSE</h1>
      <p>Thoughts: {Math.floor(thoughts)}</p>
    </main>
  );
}
