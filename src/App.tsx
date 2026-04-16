import { useEffect, useRef, useState } from 'react';
import { SYNAPSE_CONSTANTS } from '@/config/constants';
import { initAnalytics } from '@/analytics';
import { unlockAudioContext } from '@/audio';
import { useGameStore, getSnapshot } from '@/store/gameStore';
import { saveGame, loadGame } from '@/engine/save';
import { startRenderer } from '@/canvas/renderer';
import { HUD } from '@/ui/HUD';
import { TabNav, type TabId } from '@/ui/TabNav';

const SAVE_INTERVAL_MS = 30_000;

export default function App() {
  const tick = useGameStore((s) => s.tick);
  const tap = useGameStore((s) => s.tap);
  const hydrate = useGameStore((s) => s.hydrate);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('mind');

  useEffect(() => {
    void initAnalytics();
    void loadGame().then((saved) => {
      if (saved) hydrate(saved);
    });
  }, [hydrate]);

  useEffect(() => {
    const id = window.setInterval(
      () => tick(SYNAPSE_CONSTANTS.tickIntervalMs),
      SYNAPSE_CONSTANTS.tickIntervalMs,
    );
    return () => {
      window.clearInterval(id);
    };
  }, [tick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = startRenderer(canvas);
    return () => {
      handle.stop();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTap = (e: TouchEvent | MouseEvent): void => {
      e.preventDefault();
      unlockAudioContext();
      tap();
    };

    canvas.addEventListener('touchstart', handleTap, { passive: false });
    canvas.addEventListener('mousedown', handleTap);
    return () => {
      canvas.removeEventListener('touchstart', handleTap);
      canvas.removeEventListener('mousedown', handleTap);
    };
  }, [tap]);

  useEffect(() => {
    const handleVisibility = (): void => {
      if (document.visibilityState === 'hidden') {
        void saveGame(getSnapshot());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void saveGame(getSnapshot());
    }, SAVE_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  return (
    <main
      style={{
        position: 'relative',
        background: '#03050C',
        minHeight: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100vw',
          height: '100vh',
          touchAction: 'manipulation',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      />
      <HUD />
      <TabNav active={activeTab} onSelect={setActiveTab} />
    </main>
  );
}
