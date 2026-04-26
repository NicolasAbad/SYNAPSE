import { memo, useEffect, useState } from 'react';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { useGameStore } from '../../store/gameStore';
import { NEURON_CONFIG, neuronCost } from '../../config/neurons';
import { MOTION } from '../tokens';
import { t } from '../../config/strings';

/**
 * Tutorial hint stack per SPRINTS.md §Sprint 3 + PROGRESS.md Decision B +
 * Sprint 7.6 Phase 7.6.3 §37 5-cycle track extension.
 *
 * Cycle 1 (`isTutorialCycle === true`): tap → buy → discharge → variety.
 * Cycles 2-5 (`prestigeCount === 1..4`): upgrades_tab → focus_discharge →
 * polarity → patterns_hipocampo. Only one hint renders at a time.
 * Sparks reward (TUTOR-5 +2 per step) is granted at PRESTIGE-completion
 * inside the store's `prestige` action, not at hint dismiss.
 *
 * TUTOR-4: tutorial hint dismissal — auto-dismiss on the action that satisfies
 * the hint (e.g. `focus_discharge` auto-dismisses on first discharge); manual
 * dismiss is available per hint via the (×) close affordance. Dismissed
 * hint IDs persist in completedTutorialSteps so they don't re-render.
 */

type HintId =
  | 'tap' | 'buy' | 'discharge' | 'variety'
  | 'upgrades_tab' | 'focus_discharge' | 'polarity' | 'patterns_hipocampo';

const TEXT_KEY: Record<HintId, string> = {
  tap: 'tutorial.hint_tap',
  buy: 'tutorial.hint_buy',
  discharge: 'tutorial.hint_discharge',
  variety: 'tutorial.hint_variety',
  upgrades_tab: 'tutorial.hint_upgrades_tab',
  focus_discharge: 'tutorial.hint_focus_discharge',
  polarity: 'tutorial.hint_polarity',
  patterns_hipocampo: 'tutorial.hint_patterns_hipocampo',
};

const TEST_ID: Record<HintId, string> = {
  tap: 'tutorial-hint',
  buy: 'tutorial-hint-buy',
  discharge: 'tutorial-hint-discharge',
  variety: 'tutorial-hint-variety',
  upgrades_tab: 'tutorial-hint-upgrades-tab',
  focus_discharge: 'tutorial-hint-focus-discharge',
  polarity: 'tutorial-hint-polarity',
  patterns_hipocampo: 'tutorial-hint-patterns-hipocampo',
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
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const thoughts = useGameStore((s) => s.thoughts);
  const basicaCount = useGameStore((s) => s.neurons.find((n) => n.type === 'basica')?.count ?? 0);
  const sensorialCount = useGameStore((s) => s.neurons.find((n) => n.type === 'sensorial')?.count ?? 0);
  const dischargeCharges = useGameStore((s) => s.dischargeCharges);
  const cycleDischargesUsed = useGameStore((s) => s.cycleDischargesUsed);
  const sparks = useGameStore((s) => s.sparks);
  const cycleUpgradesBought = useGameStore((s) => s.cycleUpgradesBought);
  const focusBar = useGameStore((s) => s.focusBar);
  const currentPolarity = useGameStore((s) => s.currentPolarity);
  const cycleGenerated = useGameStore((s) => s.cycleGenerated);
  const currentThreshold = useGameStore((s) => s.currentThreshold);
  // Sprint 4c Phase 4c.6 — hide tutorial hint overlay when a non-Mind panel
  // is open. Hints should only appear over the canvas, not over a management
  // panel the player intentionally opened (audit bug).
  // Phase 4c.6.5 — also hide on non-home Mind subtabs (same reason as Discharge).
  const activeTab = useGameStore((s) => s.activeTab);
  const activeMindSubtab = useGameStore((s) => s.activeMindSubtab);

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

  if (activeTab !== 'mind' || activeMindSubtab !== 'home') return null;

  let active: HintId | null = null;
  if (isTutorialCycle) {
    // First-cycle tutorial hints (fire only during isTutorialCycle).
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
  } else if (prestigeCount === 1 && sparks > 0 && cycleUpgradesBought === 0) {
    // Cycle 2 §37: surface the Upgrades tab as the Sparks spending surface.
    active = 'upgrades_tab';
  } else if (prestigeCount === 2 && focusBar < SYNAPSE_CONSTANTS.cascadeThreshold && cycleDischargesUsed === 0) {
    // Cycle 3 §37: teach the Focus→Discharge→Cascade loop.
    active = 'focus_discharge';
  } else if (prestigeCount === 3 && cycleGenerated >= currentThreshold && currentPolarity === null) {
    // Cycle 4 §37: Polarity shows up in CycleSetupScreen — nudge at the
    // threshold-crossed moment when the player is about to Awaken.
    active = 'polarity';
  } else if (prestigeCount === 4) {
    // Cycle 5 §37: Mind + Regions tabs are active; introduce Patterns tree
    // and the Hipocampo shard drip. Passive reveal — auto-hidden on tab nav.
    active = 'patterns_hipocampo';
  } else if (basicaCount === 0 && thoughts >= neuronCost('basica', 0)) {
    // Post-prestige "buy first neuron" hint — PRESTIGE_RESET zeroes every
    // neuron count while the Momentum Bonus gives starting thoughts. New
    // players get stuck on "why isn't my rate going up?" without this cue.
    // Added Sprint 4c Phase 4c.6.5 after Nico's playtest feedback.
    active = 'buy';
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
