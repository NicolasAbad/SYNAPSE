import { useEffect, useRef, useState } from 'react';
import { SYNAPSE_CONSTANTS } from '@/config/constants';
import { initAnalytics } from '@/analytics';
import { unlockAudioContext } from '@/audio';
import { useGameStore } from '@/store/gameStore';
import { startRenderer } from '@/canvas/renderer';
import { HUD } from '@/ui/HUD';
import { TabNav, type TabId } from '@/ui/TabNav';

export default function App() {
  const tick = useGameStore((s) => s.tick);
  const tap = useGameStore((s) => s.tap);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('mind');

  useEffect(() => {
    void initAnalytics();
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

  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>): void => {
    e.preventDefault();
    unlockAudioContext();
    tap();
  };

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
        onTouchStart={onTouchStart}
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
