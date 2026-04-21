import { memo, useEffect, useState } from 'react';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { useGameStore } from '../../store/gameStore';
import { NEURON_CONFIG, neuronCost } from '../../config/neurons';
import { MOTION } from '../tokens';
import { t } from '../../config/strings';

/**
 * Tutorial hint stack per SPRINTS.md §Sprint 3 + PROGRESS.md Decision B.
 *
 * Renders at most ONE hint at a time; priority order: tap → buy → discharge
 * → variety. Hints 2-4 auto-dismiss when their predicate flips false (the
 * triggering action was performed). Hint 1 uses a local idle timer + tap
 * detector — the first pointerdown anywhere dismisses it permanently.
 *
 * All gates include `isTutorialCycle` — no hints after P1 per UI-9.
 *
 * - `tap`       UI-9 step 4 (Sprint 2 Phase 6 scope)
 * - `buy`       SPRINTS.md §Sprint 3 AI-check #14 (hint 2)
 * - `discharge` SPRINTS.md §Sprint 3 AI-check #14 (hint 3)
 * - `variety`   PROGRESS.md Decision B (connection-multiplier UX reinforcement)
 */

type HintId = 'tap' | 'buy' | 'discharge' | 'variety';

const TEXT_KEY: Record<HintId, string> = {
  tap: 'tutorial.hint_tap',
  buy: 'tutorial.hint_buy',
  discharge: 'tutorial.hint_discharge',
  variety: 'tutorial.hint_variety',
};

const TEST_ID: Record<HintId, string> = {
  tap: 'tutorial-hint',
  buy: 'tutorial-hint-buy',
  discharge: 'tutorial-hint-discharge',
  variety: 'tutorial-hint-variety',
};

/**
 * Minimum Basicas owned before hint #4 can fire. Source: Sensorial's
 * `neuron_count` unlock condition (same threshold by construction — hint
 * reinforces the unlock cue the player just hit).
 */
function varietyBasicaThreshold(): number {
  const unlock = NEURON_CONFIG.sensorial.unlock;
  // Sensorial is configured with `kind: 'neuron_count'` in §5 — this branch
  // is the only real one at runtime; the Infinity fallback is a type-guard
  // safety valve if the config is ever retuned.
  return unlock.kind === 'neuron_count' ? unlock.count : Number.POSITIVE_INFINITY;
}

export const TutorialHints = memo(function TutorialHints() {
  const isTutorialCycle = useGameStore((s) => s.isTutorialCycle);
  const thoughts = useGameStore((s) => s.thoughts);
  const basicaCount = useGameStore((s) => s.neurons.find((n) => n.type === 'basica')?.count ?? 0);
  const sensorialCount = useGameStore((s) => s.neurons.find((n) => n.type === 'sensorial')?.count ?? 0);
  const dischargeCharges = useGameStore((s) => s.dischargeCharges);
  const cycleDischargesUsed = useGameStore((s) => s.cycleDischargesUsed);

  const [idleTimerFired, setIdleTimerFired] = useState(false);
  const [firstTapDone, setFirstTapDone] = useState(false);

  useEffect(() => {
    if (!isTutorialCycle) return;
    const timer = setTimeout(
      () => setIdleTimerFired(true),
      SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs,
    );
    return () => clearTimeout(timer);
  }, [isTutorialCycle]);

  // Attach pointerdown listener from mount so a tap that happens before
  // the idle timer fires still marks the tutorial hint as "seen" — avoids
  // a race where the timer flushes the listener-attaching effect AFTER the
  // event has already been dispatched (caught in Phase 7.1 tests).
  useEffect(() => {
    if (firstTapDone) return;
    const onTap = () => setFirstTapDone(true);
    document.addEventListener('pointerdown', onTap, { once: true });
    return () => document.removeEventListener('pointerdown', onTap);
  }, [firstTapDone]);

  if (!isTutorialCycle) return null;

  let active: HintId | null = null;
  if (idleTimerFired && !firstTapDone) {
    active = 'tap';
  } else if (basicaCount === 1 && thoughts >= neuronCost('basica', basicaCount)) {
    active = 'buy';
  } else if (dischargeCharges > 0 && cycleDischargesUsed === 0) {
    active = 'discharge';
  } else if (
    basicaCount >= varietyBasicaThreshold() &&
    sensorialCount === 0 &&
    thoughts >= neuronCost('sensorial', sensorialCount)
  ) {
    active = 'variety';
  }

  if (active === null) return null;

  return (
    <div
      data-testid={TEST_ID[active]}
      role="status"
      style={{
        position: 'absolute',
        bottom: 'calc(var(--spacing-16) * 2)', // CONST-OK: CSS layout idiom (CODE-1 exception)
        left: '50%', // CONST-OK: CSS centering idiom (CODE-1 exception)
        transform: 'translateX(-50%)', // CONST-OK: CSS centering idiom (CODE-1 exception)
        padding: 'var(--spacing-2) var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-medium)',
        borderRadius: 'var(--radius-full)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        pointerEvents: 'none',
        transition: `opacity ${MOTION.durFast}ms ease-out`,
      }}
    >
      {t(TEXT_KEY[active])}
    </div>
  );
});
