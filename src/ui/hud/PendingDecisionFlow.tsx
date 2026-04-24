import { memo, useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PATTERN_DECISIONS } from '../../config/patterns';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { DecisionModal } from '../modals/DecisionModal';
import { useAdContext } from '../../platform/AdContext';
import { en } from '../../config/strings/en';

const tAds = en.ads;

const RETRY_TOAST_AUTODISMISS_MS = 12_000; // CONST-OK UI timing — retry CTA visible for 12s

/**
 * Orchestrates the Pattern Tree A/B decision modal (Sprint 4b Phase 4b.5).
 *
 * A decision is "pending" when:
 *   - the pattern at a decision index (6/15/24/36/48) has been acquired
 *     (present in `state.patterns`), AND
 *   - `state.patternDecisions[index]` is undefined.
 *
 * Only one pending decision is resolved at a time (the lowest-indexed). Once
 * resolved, re-render naturally advances to the next pending one if any.
 *
 * Sprint 9a Phase 9a.4 — adds a post-pick "Pick the other option (watch ad)"
 * toast (placement #4 decision_retry). On accept: tryShowAd → retryPatternDecision
 * → modal re-opens via the same pending-detection logic.
 */
export const PendingDecisionFlow = memo(function PendingDecisionFlow() {
  const patterns = useGameStore((s) => s.patterns);
  const patternDecisions = useGameStore((s) => s.patternDecisions);
  const choosePatternDecision = useGameStore((s) => s.choosePatternDecision);
  const retryPatternDecision = useGameStore((s) => s.retryPatternDecision);
  const ad = useAdContext();
  const [retryNode, setRetryNode] = useState<number | null>(null);

  const decisionIndices = SYNAPSE_CONSTANTS.patternDecisionNodes;
  const acquiredIndices = new Set(patterns.map((p) => p.index));

  const pending = decisionIndices.find(
    (idx) => acquiredIndices.has(idx) && patternDecisions[idx] === undefined,
  );

  const onChoose = useCallback(
    (choice: 'A' | 'B') => {
      if (pending === undefined) return;
      choosePatternDecision(pending, choice);
      // Surface retry CTA for this just-picked decision.
      if (!ad.inert) setRetryNode(pending);
    },
    [pending, choosePatternDecision, ad.inert],
  );

  useEffect(() => {
    if (retryNode === null) return;
    const handle = setTimeout(() => setRetryNode(null), RETRY_TOAST_AUTODISMISS_MS);
    return () => clearTimeout(handle);
  }, [retryNode]);

  const onRetryAccept = useCallback(async () => {
    if (retryNode === null) return;
    const node = retryNode;
    setRetryNode(null);
    const result = await ad.tryShowAd('decision_retry');
    if (result.status === 'shown') retryPatternDecision(node);
    // Failure / dismiss / blocked: silent. The decision stays locked; the
    // player can always re-enter via Pattern Tree → reset (PAT-3).
  }, [ad, retryNode, retryPatternDecision]);

  if (pending !== undefined) {
    const definition = PATTERN_DECISIONS[pending as 6 | 15 | 24 | 36 | 48]; // CONST-OK: patternDecisionNodes key narrowing
    return (
      <DecisionModal
        open
        nodeIndex={pending}
        definition={definition}
        onChoose={onChoose}
      />
    );
  }

  if (retryNode === null) return null;
  return (
    <div
      data-testid="decision-retry-toast"
      style={{
        position: 'absolute',
        top: 'calc(var(--spacing-16) + var(--spacing-8))', // CONST-OK CSS clearance below top HUD
        left: '50%', // CONST-OK CSS center idiom
        transform: 'translateX(-50%)', // CONST-OK CSS center idiom
        background: 'var(--color-bg-elevated, #161b27)', // CONST-OK CSS fallback
        border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-3) var(--spacing-4)', // CONST-OK CSS spacing tokens
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        pointerEvents: 'auto',
        zIndex: 940, // CONST-OK CSS HUD layer band
        touchAction: 'manipulation',
      }}
      onPointerDown={onRetryAccept}
      role="button"
    >
      {tAds.decisionRetry}
    </div>
  );
});
