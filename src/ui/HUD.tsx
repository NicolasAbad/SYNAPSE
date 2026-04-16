import { memo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { t } from '@/config/strings';
import { formatNumber, formatRate } from '@/utils/formatNumber';

const HUD_FONT = "'SF Mono', 'Roboto Mono', monospace";

const styles = {
  layer: {
    position: 'absolute' as const,
    inset: 0,
    pointerEvents: 'none' as const,
    paddingTop: 'env(safe-area-inset-top)',
    color: '#e8e6f8',
    fontFamily: HUD_FONT,
  },
  thoughts: {
    position: 'absolute' as const,
    top: 12,
    left: 16,
  },
  thoughtsValue: {
    color: '#F0A030',
    fontSize: 22,
    fontWeight: 800 as const,
    lineHeight: 1,
  },
  thoughtsLabel: {
    color: '#7070a0',
    fontSize: 10,
    marginTop: 4,
  },
  rate: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    color: '#22B07A',
    fontSize: 14,
    fontWeight: 600 as const,
  },
  charges: {
    position: 'absolute' as const,
    top: 18,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 8,
  },
  charge: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '1px solid #F0A030',
  },
  focusBar: {
    position: 'absolute' as const,
    top: 56,
    left: '20%',
    width: '60%',
    height: 4,
    background: '#ffffff08',
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  focusFill: {
    height: '100%',
    background: '#40D0D0',
    borderRadius: 2,
  },
  consciousness: {
    position: 'absolute' as const,
    top: 110,
    bottom: 110,
    right: 6,
    width: 3,
    background: '#ffffff08',
    borderRadius: 1.5,
    overflow: 'hidden' as const,
  },
  consciousnessFill: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: '#8B7FE8',
    borderRadius: 1.5,
  },
} as const;

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export const HUD = memo(function HUD() {
  const thoughts = useGameStore((s) => s.thoughts);
  const rate = useGameStore((s) => s.effectiveProductionPerSecond);
  const charges = useGameStore((s) => s.dischargeCharges);
  const maxCharges = useGameStore((s) => s.dischargeMaxCharges);
  const focus = useGameStore((s) => s.focusBar);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const cycleGenerated = useGameStore((s) => s.cycleGenerated);
  const threshold = useGameStore((s) => s.currentThreshold);
  const consciousnessUnlocked = useGameStore((s) => s.consciousnessBarUnlocked);

  const showFocus = prestigeCount >= 4;
  const focusPct = clamp01(focus) * 100;
  const consciousnessPct = clamp01(cycleGenerated / Math.max(threshold, 1)) * 100;

  return (
    <div style={styles.layer}>
      <div style={styles.thoughts}>
        <div style={styles.thoughtsValue}>{formatNumber(thoughts)}</div>
        <div style={styles.thoughtsLabel}>{t('thoughts').toLowerCase()}</div>
      </div>
      <div style={styles.rate}>{formatRate(rate)}</div>

      <div style={styles.charges} aria-label={t('charges')}>
        {Array.from({ length: maxCharges }).map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.charge,
              background: i < charges ? '#F0A030' : 'transparent',
            }}
          />
        ))}
      </div>

      {showFocus && (
        <div style={styles.focusBar} aria-label={t('focus')}>
          <div style={{ ...styles.focusFill, width: `${focusPct}%` }} />
        </div>
      )}

      {consciousnessUnlocked && (
        <div style={styles.consciousness} aria-label={t('consciousness')}>
          <div style={{ ...styles.consciousnessFill, height: `${consciousnessPct}%` }} />
        </div>
      )}
    </div>
  );
});
