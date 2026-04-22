import { memo, useCallback, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import type { PrestigeOutcome } from '../../engine/prestige';
import { ConfirmModal } from '../modals/ConfirmModal';
import { AwakeningScreen } from '../modals/AwakeningScreen';
import { CycleSetupScreen, type CycleSetupChoice } from '../modals/CycleSetupScreen';
import { ArchetypeChoiceModal } from '../modals/ArchetypeChoiceModal';
import { getMutationOptions } from '../../engine/mutations';
import { t } from '../../config/strings';
import { HUD } from '../tokens';
import type { Archetype, Pathway, Polarity } from '../../types';

/**
 * Orchestrates the prestige flow per SPRINTS.md §4a + §4c:
 *   1. Player sees AWAKENING button when cycleGenerated ≥ currentThreshold.
 *   2. Tap opens a generic ConfirmModal (Cancel default-focused).
 *   3. Confirm → store `prestige(now)` action.
 *   4. `AwakeningScreen` with PrestigeOutcome.
 *   5. "Continue" on Awakening → if `prestigeCount >= polarityUnlockPrestige`
 *      show `CycleSetupScreen` (Polarity pick); else close out.
 *   6. CycleSetupScreen Continue / SAME AS LAST → `setPolarity(chosen)` +
 *      close out.
 *
 * Pre-P3 path: CycleSetupScreen is skipped entirely (no choices to make).
 * All state is React-local — engine/store already owns the post-prestige
 * GameState; this component only coordinates UI.
 */
export const AwakeningFlow = memo(function AwakeningFlow() {
  const cycleGenerated = useGameStore((s) => s.cycleGenerated);
  const currentThreshold = useGameStore((s) => s.currentThreshold);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const lastCyclePolarityStr = useGameStore((s) => s.lastCycleConfig?.polarity ?? '');
  const lastCycleMutationStr = useGameStore((s) => s.lastCycleConfig?.mutation ?? '');
  const lastCyclePathwayStr = useGameStore((s) => s.lastCycleConfig?.pathway ?? '');
  const effectivePPS = useGameStore((s) => s.effectiveProductionPerSecond);
  const archetype = useGameStore((s) => s.archetype);
  const prestige = useGameStore((s) => s.prestige);
  const setPolarity = useGameStore((s) => s.setPolarity);
  const setMutation = useGameStore((s) => s.setMutation);
  const setPathway = useGameStore((s) => s.setPathway);
  const setArchetype = useGameStore((s) => s.setArchetype);
  // Mutation options drawn at CycleSetupScreen open. Creativa archetype
  // adds +1 option per GDD §12 (Sprint 6 Phase 6.2 wired); Genius Pass /
  // Pattern / Weekly Challenge ctx expand in Sprint 9 / 4b / 7.
  const mutationOptions = useGameStore((s) => getMutationOptions(s, { creativaArchetype: s.archetype === 'creativa' }));

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [outcome, setOutcome] = useState<PrestigeOutcome | null>(null);
  const [showCycleSetup, setShowCycleSetup] = useState(false);
  const [showArchetypeChoice, setShowArchetypeChoice] = useState(false);

  const ready = cycleGenerated >= currentThreshold;
  const lastCyclePolarity: Polarity | null =
    lastCyclePolarityStr === 'excitatory' || lastCyclePolarityStr === 'inhibitory'
      ? lastCyclePolarityStr
      : null;
  const lastCycleMutation: string | null = lastCycleMutationStr || null;
  const lastCyclePathway: Pathway | null =
    lastCyclePathwayStr === 'rapida' || lastCyclePathwayStr === 'profunda' || lastCyclePathwayStr === 'equilibrada'
      ? lastCyclePathwayStr
      : null;
  const polarityUnlocked = prestigeCount >= SYNAPSE_CONSTANTS.polarityUnlockPrestige;
  const needsArchetypeChoice = prestigeCount >= SYNAPSE_CONSTANTS.archetypeUnlockPrestige && archetype === null;

  const onReadyClick = useCallback(() => setConfirmOpen(true), []);
  const onCancel = useCallback(() => setConfirmOpen(false), []);
  const onConfirm = useCallback(() => {
    setConfirmOpen(false);
    const result = prestige(Date.now());
    if (result.fired) setOutcome(result.outcome);
  }, [prestige]);
  const onAwakeningContinue = useCallback(() => {
    setOutcome(null);
    // Sprint 6 Phase 6.2: P5+ first-time archetype choice gates the cycle
    // setup flow. After choosing, onArchetypeChoose opens CycleSetup.
    if (needsArchetypeChoice) {
      setShowArchetypeChoice(true);
      return;
    }
    // Post-prestige prestigeCount has already incremented, so the P3+ gate
    // activates on the prestige that earns it (P2→P3 shows the screen).
    if (polarityUnlocked) {
      setShowCycleSetup(true);
    }
  }, [needsArchetypeChoice, polarityUnlocked]);
  const onArchetypeChoose = useCallback((a: Archetype) => {
    setArchetype(a);
    setShowArchetypeChoice(false);
    if (polarityUnlocked) setShowCycleSetup(true);
  }, [setArchetype, polarityUnlocked]);
  const onCycleSetupChoose = useCallback((choice: CycleSetupChoice) => {
    if (choice.polarity !== null) setPolarity(choice.polarity);
    if (choice.mutationId !== null) setMutation(choice.mutationId);
    if (choice.pathway !== null) setPathway(choice.pathway);
    setShowCycleSetup(false);
  }, [setPolarity, setMutation, setPathway]);

  const showReadyButton = ready && !confirmOpen && !outcome && !showCycleSetup && !showArchetypeChoice;

  return (
    <>
      {showReadyButton && (
        <button
          type="button"
          data-testid="hud-awakening-button"
          onPointerDown={onReadyClick}
          style={{
            position: 'absolute',
            left: '50%', // CONST-OK: center horizontally
            transform: 'translateX(-50%)', // CONST-OK: center horizontally
            bottom: 'calc(var(--spacing-12) + env(safe-area-inset-bottom, 0))', // CONST-OK: CSS custom property ref
            minHeight: HUD.touchTargetMin,
            padding: 'var(--spacing-3) var(--spacing-6)', // CONST-OK: CSS custom property ref
            background: 'var(--color-primary)',
            color: 'var(--color-bg-deep)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-bold)',
            letterSpacing: '0.08em', // CONST-OK: CSS tracking idiom
            boxShadow: '0 0 24px var(--color-primary)', // CONST-OK: CSS shadow idiom
            cursor: 'pointer',
            touchAction: 'manipulation',
            pointerEvents: 'auto',
            zIndex: 920, // CONST-OK: above regular HUD, below modals
          }}
          aria-label={t('awakening.ready_label')}
        >
          {t('awakening.ready_label')}
        </button>
      )}
      <ConfirmModal
        open={confirmOpen}
        title={t('awakening.confirm_title')}
        body={t('awakening.confirm_body')}
        confirmLabel={t('awakening.confirm_button')}
        cancelLabel={t('confirm.cancel')}
        onConfirm={onConfirm}
        onCancel={onCancel}
        testIdPrefix="awakening-confirm"
      />
      <AwakeningScreen outcome={outcome} onContinue={onAwakeningContinue} />
      <ArchetypeChoiceModal open={showArchetypeChoice} onChoose={onArchetypeChoose} />
      {showCycleSetup && (
        <CycleSetupScreen
          prestigeCount={prestigeCount}
          lastCyclePolarity={lastCyclePolarity}
          lastCycleMutation={lastCycleMutation}
          lastCyclePathway={lastCyclePathway}
          mutationOptions={mutationOptions}
          effectivePPS={effectivePPS}
          currentThreshold={currentThreshold}
          onChoose={onCycleSetupChoose}
        />
      )}
    </>
  );
});
