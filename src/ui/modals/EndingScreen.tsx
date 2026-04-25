// Sprint 6 Phase 6.6 — P26 ending screen (GDD §9 + NARRATIVE.md §6).
// Shown when prestigeCount === 26 AND cycleGenerated >= currentThreshold.
// Picks ending by archetype (Equation / Chorus / Seed); if all 4 Resonant
// Patterns are discovered, shows the Singularity secret ending instead.
// Binary choice (A / B); both are valid endings. Choice is logged via
// chooseEnding action → endingsSeen.

import { memo, useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { t } from '../../config/strings';
import { en } from '../../config/strings/en';
import { HUD } from '../tokens';
import { useGameStore } from '../../store/gameStore';
import { ENDINGS_BY_ARCHETYPE, ENDINGS_BY_ID } from '../../config/narrative/endings';
import { allResonantPatternsDiscovered } from '../../engine/resonantPatterns';
import type { EndingDef } from '../../config/narrative/endings';

type Phase = 'idle' | 'chosen';

function pickEnding(archetype: string | null, allRps: boolean): EndingDef | null {
  if (allRps) return ENDINGS_BY_ID.singularity;
  if (archetype === 'analitica') return ENDINGS_BY_ARCHETYPE.analitica;
  if (archetype === 'empatica') return ENDINGS_BY_ARCHETYPE.empatica;
  if (archetype === 'creativa') return ENDINGS_BY_ARCHETYPE.creativa;
  return null; // No archetype chosen — shouldn't happen at P26 but be defensive.
}

export interface EndingScreenProps {
  open: boolean;
  /** Sprint 8b Phase 8b.6: passes the chosen ending id through to the Transcendence flow. */
  onContinue: (endingId: EndingDef['id']) => void;
}

export const EndingScreen = memo(function EndingScreen({ open, onContinue }: EndingScreenProps) {
  const archetype = useGameStore((s) => s.archetype);
  const resonantPatternsDiscovered = useGameStore((s) => s.resonantPatternsDiscovered);
  const chooseEnding = useGameStore((s) => s.chooseEnding);
  const [phase, setPhase] = useState<Phase>('idle');
  const [picked, setPicked] = useState<'a' | 'b' | null>(null);

  const allRps = allResonantPatternsDiscovered({ resonantPatternsDiscovered });
  const def = pickEnding(archetype, allRps);

  const onPick = useCallback((choice: 'a' | 'b') => {
    if (!def) return;
    chooseEnding(def.id, choice);
    setPicked(choice);
    setPhase('chosen');
  }, [def, chooseEnding]);

  const onContinueClick = useCallback(() => {
    if (!def) return;
    setPhase('idle');
    setPicked(null);
    onContinue(def.id);
  }, [def, onContinue]);

  // Sprint 10 Phase 10.7 — Capacitor.Share. Native-only; web preview no-ops.
  const lifetimePrestiges = useGameStore((s) => s.lifetimePrestiges);
  const onShareClick = useCallback(async () => {
    if (!def) return;
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: en.endingShare.title,
        text: en.endingShare.text
          .replace('{{ending}}', t(`${def.i18nRoot}.title`))
          .replace('{{prestiges}}', String(lifetimePrestiges)),
        dialogTitle: en.endingShare.title,
      });
    } catch (e) {
      // Share is silent on cancel; only log unexpected errors. Never throw.
      console.error('[EndingScreen] share failed:', e);
    }
  }, [def, lifetimePrestiges]);

  if (!open || !def) return null;

  const optionAText = t(`${def.i18nRoot}.text_a`);
  const optionBText = t(`${def.i18nRoot}.text_b`);
  const resolutionText = picked === 'a' ? optionAText : optionBText;

  return (
    <div
      data-testid="ending-screen"
      data-ending-id={def.id}
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ending-screen-title"
      style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0, // CONST-OK: CSS full-bleed
        background: 'var(--color-bg-deep)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-6)', // CONST-OK
        zIndex: 960, // CONST-OK: above Era3EventModal (955)
        pointerEvents: 'auto',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 560, // CONST-OK: readable ending-text width
          width: '100%', // CONST-OK
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.2em', // CONST-OK
            textTransform: 'uppercase',
            marginBottom: 'var(--spacing-3)', // CONST-OK
          }}
        >
          {t('endings.title')}
        </div>
        <h1
          id="ending-screen-title"
          data-testid="ending-screen-title"
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--spacing-5)', // CONST-OK
          }}
        >
          {t(`${def.i18nRoot}.title`)}
        </h1>
        {phase === 'idle' ? (
          <>
            <p
              data-testid="ending-intro"
              style={{
                fontSize: 'var(--text-base)',
                fontStyle: 'italic',
                lineHeight: 1.7, // CONST-OK: prose readability
                marginBottom: 'var(--spacing-6)', // CONST-OK
                color: 'var(--color-text-primary)',
              }}
            >
              {t(`${def.i18nRoot}.intro`)}
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-3)', // CONST-OK
                marginBottom: 'var(--spacing-6)', // CONST-OK
              }}
            >
              <button type="button" data-testid="ending-option-a" onPointerDown={() => onPick('a')} style={optionStyle}>
                {t(`${def.i18nRoot}.label_a`)}
              </button>
              <button type="button" data-testid="ending-option-b" onPointerDown={() => onPick('b')} style={optionStyle}>
                {t(`${def.i18nRoot}.label_b`)}
              </button>
            </div>
          </>
        ) : (
          <>
            <p
              data-testid="ending-resolution"
              style={{
                fontSize: 'var(--text-base)',
                lineHeight: 1.7, // CONST-OK: prose readability
                marginBottom: 'var(--spacing-6)', // CONST-OK
                color: 'var(--color-text-primary)',
                whiteSpace: 'pre-line',
              }}
            >
              {resolutionText}
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'center' /* CONST-OK CSS spacing */ }}>
              <button
                type="button"
                data-testid="ending-share"
                onPointerDown={onShareClick}
                style={{
                  minHeight: HUD.touchTargetMin,
                  padding: 'var(--spacing-3) var(--spacing-5)', // CONST-OK
                  background: 'transparent',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-medium)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                {en.endingShare.button}
              </button>
              <button
                type="button"
                data-testid="ending-continue"
                onPointerDown={onContinueClick}
                style={{
                  minHeight: HUD.touchTargetMin,
                  padding: 'var(--spacing-3) var(--spacing-6)', // CONST-OK
                  background: 'var(--color-primary)',
                  color: 'var(--color-bg-deep)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-bold)',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                {t('endings.continue')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

const optionStyle: React.CSSProperties = {
  minHeight: HUD.touchTargetMin,
  padding: 'var(--spacing-3) var(--spacing-4)', // CONST-OK
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-medium)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-weight-semibold)',
  cursor: 'pointer',
  touchAction: 'manipulation',
};
