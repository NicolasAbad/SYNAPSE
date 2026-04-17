import { useGameStore } from './store/gameStore';
import { useInitSession } from './store/initSession';

export function App() {
  useInitSession();
  const thoughts = useGameStore((s) => s.thoughts);
  return (
    <main style={{ fontFamily: 'system-ui', padding: 16 }}>
      <h1>SYNAPSE</h1>
      <p>Thoughts: {Math.floor(thoughts)}</p>
    </main>
  );
}
