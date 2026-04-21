import { memo, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PATTERN_DECISIONS } from '../../config/patterns';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { DecisionModal } from '../modals/DecisionModal';

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
 * The modal has no Cancel — the decision must be made to advance.
 */
export const PendingDecisionFlow = memo(function PendingDecisionFlow() {
  const patterns = useGameStore((s) => s.patterns);
  const patternDecisions = useGameStore((s) => s.patternDecisions);
  const choosePatternDecision = useGameStore((s) => s.choosePatternDecision);

  const decisionIndices = SYNAPSE_CONSTANTS.patternDecisionNodes;
  const acquiredIndices = new Set(patterns.map((p) => p.index));

  const pending = decisionIndices.find(
    (idx) => acquiredIndices.has(idx) && patternDecisions[idx] === undefined,
  );

  const onChoose = useCallback(
    (choice: 'A' | 'B') => {
      if (pending === undefined) return;
      choosePatternDecision(pending, choice);
    },
    [pending, choosePatternDecision],
  );

  if (pending === undefined) return null;
  const definition = PATTERN_DECISIONS[pending as 6 | 15 | 24 | 36 | 48]; // CONST-OK: patternDecisionNodes key narrowing

  return (
    <DecisionModal
      open
      nodeIndex={pending}
      definition={definition}
      onChoose={onChoose}
    />
  );
});
