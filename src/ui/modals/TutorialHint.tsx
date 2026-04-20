import { memo, useEffect, useState } from 'react';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { useGameStore } from '../../store/gameStore';
import { MOTION } from '../tokens';
import { t } from '../../config/strings';

/**
 * UI-9 step 4: "Tap the neuron" hint after `firstOpenTutorialHintIdleMs`
 * of idle. Only shows during the tutorial cycle. Dismisses on first
 * touchstart anywhere. Local React state only — no GameState field.
 *
 * Sprint 3 introduces the full 3-tooltip tutorial (buy, discharge) —
 * this phase ships only the first hint.
 */
export const TutorialHint = memo(function TutorialHint() {
  const isTutorialCycle = useGameStore((s) => s.isTutorialCycle);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isTutorialCycle) return;
    const timer = setTimeout(
      () => setVisible(true),
      SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs,
    );
    return () => clearTimeout(timer);
  }, [isTutorialCycle]);

  useEffect(() => {
    if (!visible) return;
    const dismiss = () => setVisible(false);
    document.addEventListener('touchstart', dismiss, { passive: true, once: true });
    document.addEventListener('pointerdown', dismiss, { once: true });
    return () => {
      document.removeEventListener('touchstart', dismiss);
      document.removeEventListener('pointerdown', dismiss);
    };
  }, [visible]);

  if (!isTutorialCycle || !visible) return null;

  return (
    <div
      data-testid="tutorial-hint"
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
      {t('tutorial.hint_tap')}
    </div>
  );
});
