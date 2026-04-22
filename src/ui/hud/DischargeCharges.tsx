import { memo, useEffect, useState } from 'react';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { useGameStore } from '../../store/gameStore';
import { UPGRADES_BY_ID } from '../../config/upgrades';
import { t } from '../../config/strings';
import { HUD } from '../tokens';

/**
 * Top-center discharge charges + live countdown to next charge.
 *
 * Pip row: renders `dischargeMaxCharges` circles (default 2 at P0, 3 at
 * P10+, 4 at P15+ with upgrade). Fill count = `dischargeCharges`.
 *
 * Countdown label: "Discharge ⚡ MM:SS" when below max, "Discharge ⚡"
 * (no timer) when at max. Sprint 4c.6.7 — playtest finding #5: 20-min
 * regen + 7-9 min tutorial cycle meant first-time players never saw a
 * charge land. Now they at least see the timer ticking down so they
 * know it's coming.
 */
function formatMmSs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000)); // CONST-OK: ms→s
  const m = Math.floor(totalSec / 60); // CONST-OK: s→min
  const s = totalSec % 60; // CONST-OK: s→s
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Match tick.ts step-6: charge_rate_mult upgrades shorten the regen interval. */
function effectiveChargeIntervalMs(upgrades: ReturnType<typeof useGameStore.getState>['upgrades']): number {
  let intervalMs = SYNAPSE_CONSTANTS.chargeIntervalMinutes * 60_000; // CONST-OK: min→ms
  for (const u of upgrades) {
    if (!u.purchased) continue;
    const e = UPGRADES_BY_ID[u.id]?.effect;
    if (e?.kind === 'charge_rate_mult') intervalMs = intervalMs / e.mult;
  }
  return intervalMs;
}

export const DischargeCharges = memo(function DischargeCharges() {
  const charges = useGameStore((s) => s.dischargeCharges);
  const maxCharges = useGameStore((s) => s.dischargeMaxCharges);
  const lastTimestamp = useGameStore((s) => s.dischargeLastTimestamp);
  const upgrades = useGameStore((s) => s.upgrades);

  // Force re-render every second so the MM:SS label decrements visibly.
  // Cheap (≤1 React render/sec on a single small subtree); much simpler
  // than threading nowTimestamp into the store.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (charges >= maxCharges) return; // no point ticking when no regen
    const id = setInterval(() => setNow(Date.now()), 1000); // CONST-OK: 1s tick
    return () => clearInterval(id);
  }, [charges, maxCharges]);

  const intervalMs = effectiveChargeIntervalMs(upgrades);
  const remainingMs = lastTimestamp + intervalMs - now;
  const showCountdown = charges < maxCharges && remainingMs > 0;

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
        data-testid="hud-charge-label"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-discharge-btn)',
          opacity: HUD.dischargeLabelOpacity,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {t('hud.charge_countdown_prefix')}
        {showCountdown ? ` ${formatMmSs(remainingMs)}` : ''}
      </div>
    </div>
  );
});
