import { memo, useCallback, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { t } from '../../config/strings';
import { formatCurrency } from '../util/formatNumber';
import { ConfirmModal } from '../modals/ConfirmModal';
import { HUD } from '../tokens';

/**
 * Pattern Tree visualization — Sprint 4b Phase 4b.4. Basic grid of the 50
 * pattern slots: filled slots glow, decision-node slots tint by A/B choice,
 * empty slots render as neutral outlines. Polish (linked-graph layout,
 * connection animations) lives in Sprint 10.
 *
 * PAT-3 reset: bottom button, 2-stage ConfirmModal per GDD §10. Disabled
 * when `resonance < patternResetCostResonance` (1000).
 *
 * Decision A/B prompts at newly-crossed decision nodes land in Phase 4b.5.
 */
export const PatternTreeView = memo(function PatternTreeView() {
  const patterns = useGameStore((s) => s.patterns);
  const patternDecisions = useGameStore((s) => s.patternDecisions);
  const totalPatterns = useGameStore((s) => s.totalPatterns);
  const resonance = useGameStore((s) => s.resonance);
  const resetPatternDecisions = useGameStore((s) => s.resetPatternDecisions);

  const [confirmStage, setConfirmStage] = useState<0 | 1 | 2>(0); // CONST-OK: stage machine 0=closed, 1=stage 1, 2=stage 2

  const cost = SYNAPSE_CONSTANTS.patternResetCostResonance;
  const canReset = resonance >= cost;
  const hasAnyDecision = Object.keys(patternDecisions).length > 0;

  const onResetClick = useCallback(() => {
    if (!canReset) return;
    setConfirmStage(1);
  }, [canReset]);
  const onStageOneConfirm = useCallback(() => setConfirmStage(2), []); // CONST-OK: stage machine literal
  const onStageTwoConfirm = useCallback(() => {
    resetPatternDecisions();
    setConfirmStage(0);
  }, [resetPatternDecisions]);
  const onCancel = useCallback(() => setConfirmStage(0), []);

  return (
    <div data-testid="pattern-tree-view" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' /* CONST-OK: CSS custom property ref */ }}>
      <TreeHeader totalPatterns={totalPatterns} />
      <TreeGrid patterns={patterns} decisions={patternDecisions} />
      <ResetRow
        resonance={resonance}
        cost={cost}
        canReset={canReset && hasAnyDecision}
        onClick={onResetClick}
      />
      <ConfirmModal
        open={confirmStage === 1}
        title={t('mind_subtabs.reset_confirm_1_title')}
        body={t('mind_subtabs.reset_confirm_1_body')}
        confirmLabel={t('mind_subtabs.reset_confirm_button')}
        cancelLabel={t('confirm.cancel')}
        onConfirm={onStageOneConfirm}
        onCancel={onCancel}
        testIdPrefix="pattern-reset-1"
      />
      <ConfirmModal
        open={confirmStage === 2} // CONST-OK: stage machine literal
        title={t('mind_subtabs.reset_confirm_2_title')}
        body={t('mind_subtabs.reset_confirm_2_body')}
        confirmLabel={t('mind_subtabs.reset_confirm_button')}
        cancelLabel={t('confirm.cancel')}
        onConfirm={onStageTwoConfirm}
        onCancel={onCancel}
        testIdPrefix="pattern-reset-2" // CONST-OK: stage-2 test-id suffix
      />
    </div>
  );
});

function TreeHeader({ totalPatterns }: { totalPatterns: number }) {
  return (
    <div data-testid="pattern-tree-header" style={{ textAlign: 'center', color: 'var(--color-text-primary)' }}>
      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)' }}>
        {t('mind_subtabs.patterns_title')}
      </h3>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-1)' /* CONST-OK: CSS custom property ref */ }}>
        {totalPatterns} / {SYNAPSE_CONSTANTS.patternTreeSize} {t('mind_subtabs.patterns_progress')}
      </div>
      {/* Pattern Tree explanation — fills the content gap Nico flagged during
          playtest. Previously the grid had no in-game explanation of what
          patterns DO or what decision nodes are. */}
      <div
        data-testid="pattern-tree-explain"
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-secondary)',
          marginTop: 'var(--spacing-2)' /* CONST-OK: CSS custom property ref */,
          lineHeight: 1.5 /* CONST-OK: CSS readability idiom */,
          opacity: 0.85 /* CONST-OK: CSS secondary-info opacity */,
          padding: '0 var(--spacing-3)' /* CONST-OK: CSS custom property ref */,
        }}
      >
        {t('mind_subtabs.patterns_explain')}
      </div>
    </div>
  );
}

function TreeGrid({ patterns, decisions }: { patterns: readonly { index: number; isDecisionNode: boolean }[]; decisions: Record<number, 'A' | 'B'> }) {
  const acquired = new Set(patterns.map((p) => p.index));
  const decisionSet = new Set<number>(SYNAPSE_CONSTANTS.patternDecisionNodes);
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < SYNAPSE_CONSTANTS.patternTreeSize; i++) {
    cells.push(
      <TreeCell
        key={i}
        index={i}
        isAcquired={acquired.has(i)}
        isDecisionNode={decisionSet.has(i)}
        decision={decisions[i]}
      />,
    );
  }
  return (
    <div
      data-testid="pattern-tree-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 1fr)', // CONST-OK: 50 = 10 × 5 grid
        gap: 'var(--spacing-1)', // CONST-OK: CSS custom property ref
      }}
    >
      {cells}
    </div>
  );
}

function TreeCell({
  index,
  isAcquired,
  isDecisionNode,
  decision,
}: {
  index: number;
  isAcquired: boolean;
  isDecisionNode: boolean;
  decision?: 'A' | 'B';
}) {
  const background = !isAcquired
    ? 'transparent'
    : decision === 'A'
      ? 'var(--color-primary)'
      : decision === 'B'
        ? 'var(--color-rate-counter)'
        : isDecisionNode
          ? 'var(--color-accent)' // pending decision — will be resolved in 4b.5
          : 'var(--color-border-medium)';
  const label = decision ?? (isDecisionNode ? '?' : '');
  return (
    <div
      data-testid={`pattern-cell-${index}`}
      data-decision={decision ?? ''}
      data-pending={isAcquired && isDecisionNode && !decision ? 'true' : 'false'}
      style={{
        aspectRatio: '1 / 1',
        borderRadius: isDecisionNode ? 'var(--radius-sm)' : 'var(--radius-full)',
        border: '1px solid var(--color-border-subtle)',
        background,
        color: 'var(--color-bg-deep)',
        fontSize: 'var(--text-xs)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'var(--font-weight-semibold)',
      }}
    >
      {label}
    </div>
  );
}

function ResetRow({
  resonance,
  cost,
  canReset,
  onClick,
}: {
  resonance: number;
  cost: number;
  canReset: boolean;
  onClick: () => void;
}) {
  const disabled = !canReset;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-1)' /* CONST-OK: CSS custom property ref */ }}>
      <button
        type="button"
        data-testid="pattern-reset-button"
        onPointerDown={onClick}
        disabled={disabled}
        style={{
          minHeight: HUD.touchTargetMin,
          padding: 'var(--spacing-2) var(--spacing-5)', // CONST-OK: CSS custom property ref
          background: disabled ? 'transparent' : 'var(--color-danger, var(--color-rate-counter))',
          border: '1px solid var(--color-border-medium)',
          borderRadius: 'var(--radius-md)',
          color: disabled ? 'var(--color-text-secondary)' : 'var(--color-bg-deep)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          touchAction: 'manipulation',
          opacity: disabled ? 0.5 : 1, // CONST-OK: CSS disabled-state idiom
        }}
      >
        {t('mind_subtabs.reset_button')}
      </button>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
        {formatCurrency(resonance)} / {formatCurrency(cost)} {disabled ? t('mind_subtabs.reset_blocked_tooltip') : ''}
      </div>
    </div>
  );
}
