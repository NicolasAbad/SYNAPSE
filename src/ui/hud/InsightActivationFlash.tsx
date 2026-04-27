// Pre-launch audit Tier 2 (A-2) — Insight activation visual celebration.
//
// Audit finding: Insight activation was presentationally silent — the
// effective rate jumped 3-18× but nothing on screen marked the moment.
// This adds a brief screen tint + "INSIGHT L{N}" hero label whenever
// `state.insightActive` transitions false → true (publish source: store/
// tickScheduler line 53 + store/tap.ts on tap-driven crossings).
//
// Tint colors per level (matches GDD §6 mental model — Claro/Profundo/
// Trascendente progress from cool green → violet → gold):
//   L1 Claro       → success green
//   L2 Profundo    → primary violet
//   L3 Trascendente → accent gold
//
// Reduced-motion: skipped (audio still fires via tickScheduler line 54).

import { memo, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ActivationFlash } from './ActivationFlash';
import { subscribeInsightActivation } from './insightActivationEvents';
import { t } from '../../config/strings';

const FLASH_DURATION_MS = 1000; // CONST-OK longer than cascade — audit asked for ~1s window

const TINT_BY_LEVEL: Record<number, string> = {
  1: '#22B07A', // CONST-OK matches --color-success
  2: '#8B7FE8', // CONST-OK matches --color-primary
  3: '#F0A030', // CONST-OK matches --color-accent (gold for Trascendente)
};

export const InsightActivationFlash = memo(function InsightActivationFlash() {
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const [trigger, setTrigger] = useState<{ id: number; label: string; subLabel?: string; tintColor: string } | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    let nextId = 1;
    const unsub = subscribeInsightActivation((level) => {
      const tint = TINT_BY_LEVEL[level] ?? TINT_BY_LEVEL[1];
      setTrigger({
        id: nextId++,
        label: `${t('activation_flash.insight')} L${level}`,
        tintColor: tint,
      });
    });
    return unsub;
  }, [reducedMotion]);

  return (
    <ActivationFlash
      trigger={trigger}
      durationMs={FLASH_DURATION_MS}
      onComplete={() => setTrigger(null)}
      testId="insight-activation-flash"
    />
  );
});
