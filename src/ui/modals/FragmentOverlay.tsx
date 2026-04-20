import { memo, useEffect, useState } from 'react';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { useGameStore } from '../../store/gameStore';
import { MOTION } from '../tokens';
import { t } from '../../config/strings';

// STUB: replaced by canvas narrative renderer in Sprint 6 (§GDD.md §29 UI-5).
// DOM overlay is adequate for Phase 6's single-fragment BASE-01 trigger;
// Sprint 6 introduces the full fragment pipeline (per-archetype draws,
// Echo replay, canvas fade-in against active theme).

/**
 * UI-9 step 5: BASE-01 narrative fragment renders on first tap during
 * the tutorial cycle. Fade-in uses `MOTION.durSlow`, hold uses
 * `narrativeFragmentDisplayMs`, fade-out uses `MOTION.durSlow`.
 *
 * Only renders if `isTutorialCycle === true` AND not already shown
 * this session (session-local flag, no GameState field per [D2]/[D3]).
 */
type Phase = 'idle' | 'fading-in' | 'visible' | 'fading-out' | 'done';

export const FragmentOverlay = memo(function FragmentOverlay() {
  const isTutorialCycle = useGameStore((s) => s.isTutorialCycle);
  const [phase, setPhase] = useState<Phase>('idle');
  const [shownOnce, setShownOnce] = useState(false);

  useEffect(() => {
    if (!isTutorialCycle || shownOnce) return;

    const onFirstTap = () => {
      setShownOnce(true);
      setPhase('fading-in');
    };
    // Listen broadly — first tap anywhere counts. Canvas tap handler in
    // Sprint 3 will also trigger thought accumulation; fragment trigger
    // is independent.
    document.addEventListener('pointerdown', onFirstTap, { once: true });
    return () => document.removeEventListener('pointerdown', onFirstTap);
  }, [isTutorialCycle, shownOnce]);

  useEffect(() => {
    if (phase === 'fading-in') {
      const t1 = setTimeout(() => setPhase('visible'), MOTION.durSlow);
      return () => clearTimeout(t1);
    }
    if (phase === 'visible') {
      const t2 = setTimeout(
        () => setPhase('fading-out'),
        SYNAPSE_CONSTANTS.narrativeFragmentDisplayMs,
      );
      return () => clearTimeout(t2);
    }
    if (phase === 'fading-out') {
      const t3 = setTimeout(() => setPhase('done'), MOTION.durSlow);
      return () => clearTimeout(t3);
    }
    return undefined;
  }, [phase]);

  if (phase === 'idle' || phase === 'done' || !isTutorialCycle) return null;

  // Visible while holding; 0 during fade-out. Fade-in relies on CSS transition
  // — rendered opacity is 1 but the CSS transition duration animates from 0.
  const opacity = phase === 'fading-out' ? 0 : 1; // CONST-OK: binary visible/hidden (CODE-1 exception)

  return (
    <div
      data-testid="fragment-overlay"
      data-phase={phase}
      style={{
        position: 'absolute',
        top: '25%', // CONST-OK: CSS positioning idiom (CODE-1 exception)
        left: 'var(--spacing-6)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        right: 'var(--spacing-6)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        textAlign: 'center',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--font-weight-light)',
        lineHeight: 1.65, // CONST-OK: NARRATIVE typography idiom (CODE-1 exception)
        letterSpacing: '0.02em', // CONST-OK: CSS typography idiom (CODE-1 exception)
        opacity,
        transition: `opacity ${MOTION.durSlow}ms ease-in-out`,
        pointerEvents: 'none',
        zIndex: 500, // CONST-OK: above canvas, below splash (CODE-1 exception)
      }}
    >
      {t('narrative.base_01')}
    </div>
  );
});
