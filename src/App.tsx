import { useEffect } from 'react';
import { SYNAPSE_CONSTANTS } from '@/config/constants';
import { t } from '@/config/strings';
import { initAnalytics } from '@/analytics';
import { unlockAudioContext } from '@/audio';
import { useGameStore } from '@/store/gameStore';

export default function App() {
  const tick = useGameStore((s) => s.tick);
  const thoughts = useGameStore((s) => s.thoughts);
  const eps = useGameStore((s) => s.effectiveProductionPerSecond);

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

  return (
    <main
      onPointerDown={unlockAudioContext}
      style={{
        background: '#03050C',
        color: '#FFFFFF',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        padding: '24px',
      }}
    >
      <h1>{t('app_name')}</h1>
      <p>
        {t('thoughts')}: {Math.floor(thoughts)}
      </p>
      <p>
        {eps.toFixed(2)}
        {t('per_second')}
      </p>
      <p style={{ opacity: 0.5, fontSize: '12px' }}>Sprint 1 scaffold — UI lands in Sprint 2.</p>
    </main>
  );
}
