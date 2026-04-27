import { memo, useEffect, useState } from 'react';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { MOTION } from '../tokens';
import { t } from '../../config/strings';
import { useGameStore } from '../../store/gameStore';

/**
 * UI-9 step 1: branded splash — full-screen dark overlay with
 * app name centered. Auto-dismisses after `splashDurationMs`.
 * Fade-out uses `TOKENS.MOTION.durSlow` before invoking onComplete.
 *
 * Shown on EVERY cold open (no persistence flag — per Phase 6 [D2]).
 * GameState.ts is frozen; splash state is React-local only.
 */
interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = memo(function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadingOut, setFadingOut] = useState(false);
  const reducedMotion = useGameStore((s) => s.reducedMotion);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadingOut(true), SYNAPSE_CONSTANTS.splashDurationMs);
    const completeTimer = setTimeout(
      onComplete,
      SYNAPSE_CONSTANTS.splashDurationMs + MOTION.durSlow,
    );
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      data-testid="splash-screen"
      data-fading={fadingOut}
      style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0, // CONST-OK: CSS full-bleed (CODE-1 exception)
        background: 'var(--color-bg-deep)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000, // CONST-OK: top-layer overlay stacking idiom (CODE-1 exception)
        opacity: fadingOut ? 0 : 1, // CONST-OK: binary visible/hidden (CODE-1 exception)
        transition: reducedMotion ? 'none' : `opacity ${MOTION.durSlow}ms ease-out`,
        pointerEvents: fadingOut ? 'none' : 'auto',
      }}
    >
      <div
        data-testid="splash-title"
        className="splash-pulse"
        style={{
          color: 'var(--color-primary)',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-4xl)',
          fontWeight: 'var(--font-weight-heaviest)',
          letterSpacing: '0.12em', // CONST-OK: CSS typography idiom (CODE-1 exception)
        }}
      >
        {t('app.name')}
      </div>
    </div>
  );
});
