import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { t } from '../../config/strings';
import { HUD } from '../tokens';

/**
 * Top-center discharge charges. Mockup: 3 circles at (175, 190, 205)
 * y=48 r=5. Filled amber if owned, stroke-only ~25% amber if empty.
 * Label "Discharge ⚡ 14:32" below at y=66 font-9 amber-60%.
 *
 * Phase 5: renders `dischargeMaxCharges` circles (default 2 at P0, 3
 * at P10+, 4 at P15+ with upgrade). Fill count = `dischargeCharges`.
 * Live countdown to next charge is DEFERRED to Sprint 3 when the
 * charge-generation tick logic wires; Phase 5 shows just the label
 * prefix with no time (to avoid a fake-looking countdown that never
 * decrements).
 */
export const DischargeCharges = memo(function DischargeCharges() {
  const charges = useGameStore((s) => s.dischargeCharges);
  const maxCharges = useGameStore((s) => s.dischargeMaxCharges);

  return (
    <div
      data-testid="hud-charges"
      style={{
        position: 'absolute',
        top: 'var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        left: '50%', // CONST-OK: CSS centering idiom (CODE-1 exception)
        transform: 'translateX(-50%)', // CONST-OK: CSS centering idiom (CODE-1 exception)
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--spacing-1)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', gap: HUD.pipGap }}>
        {Array.from({ length: maxCharges }, (_, i) => (
          <span
            key={i}
            data-testid={i < charges ? 'hud-charge-filled' : 'hud-charge-empty'}
            style={{
              width: HUD.pipSize,
              height: HUD.pipSize,
              borderRadius: '50%', // CONST-OK: CSS circle idiom (CODE-1 exception)
              background: i < charges ? 'var(--color-discharge-btn)' : 'transparent',
              border: i < charges ? 'none' : '1.5px solid var(--color-discharge-btn)', // CONST-OK: CSS stroke width (CODE-1 exception)
              opacity: i < charges ? 1 : HUD.dischargePipFadedOpacity,
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-discharge-btn)',
          opacity: HUD.dischargeLabelOpacity,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {t('hud.charge_countdown_prefix')}
      </div>
    </div>
  );
});
