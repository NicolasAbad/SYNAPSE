// Sprint 7.10 Phase 7.10.5 — Sleep screen / Welcome-back modal (GDD §19).
// Renders when `pendingOfflineSummary` is non-null AND elapsed ≥ offlineModalMinSeconds.
// Composition:
//   - Header animation (CSS fade-in)
//   - Summary stats (time / thoughts gathered / efficiency / OFFLINE-2 cap note)
//   - Conditional banners: OFFLINE-7 enhanced Discharge, Lucid Dream choice, rewarded ad stub
//   - Dismiss button
//
// Rewarded ad button is a UI stub for Sprint 7.10 (ad SDK + actual reward double
// land in Sprint 9a). Lucid Dream choices wire via store actions (Phase 7.10.5).

import { memo } from 'react';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { useGameStore } from '../../store/gameStore';
import { en } from '../../config/strings/en';

const t = en.sleep;

// All CSS numeric literals below are design idioms — CONST-OK per CLAUDE.md CODE-1
// "CSS values" exception. Design tokens live in src/ui/tokens.ts; component-local
// values follow the existing App.tsx / FragmentOverlay.tsx precedent.

/** OFFLINE-10: returning-player greeting indexed by avgMoodTier (0-4). GDD §19. */
function greetingForMoodTier(tier: number): string {
  if (tier <= 0) return t.greetings.numb; // CONST-OK MoodTierIndex
  if (tier === 1) return t.greetings.calm; // CONST-OK MoodTierIndex
  if (tier === 2) return t.greetings.engaged; // CONST-OK MoodTierIndex
  if (tier === 3) return t.greetings.elevated; // CONST-OK MoodTierIndex
  return t.greetings.euphoric; // CONST-OK MoodTierIndex (4 = Euphoric)
}

function formatElapsed(elapsedMs: number): string {
  const mins = Math.floor(elapsedMs / 60_000); // CONST-OK ms→min
  const hours = Math.floor(mins / 60); // CONST-OK min→h
  if (hours > 0) return `${hours}h ${mins - hours * 60}m`; // CONST-OK min→h
  return `${mins}m`;
}

const overlayStyle = { // CONST-OK CSS style object
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(5, 7, 13, 0.92)', // CONST-OK CSS dim-overlay alpha
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 940, // CONST-OK: same band as CycleSetupScreen modal layer
  padding: 'var(--spacing-6)',
  animation: 'sleep-fade-in 0.6s ease-out', // CONST-OK CSS animation duration
};

const cardStyle = { // CONST-OK CSS style object
  background: 'var(--color-bg-deep, #0a0e1a)',
  border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-6)',
  maxWidth: '480px', // CONST-OK CSS max-width idiom
  width: '100%', // CONST-OK CSS full-width idiom
  textAlign: 'center' as const,
};

const titleStyle = { // CONST-OK CSS style object
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-weight-light)',
  marginBottom: 'var(--spacing-4)',
  letterSpacing: '0.02em', // CONST-OK CSS typography idiom
};

const statRowStyle = { // CONST-OK CSS style object
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
  padding: 'var(--spacing-2) 0', // CONST-OK CSS spacing idiom
  borderBottom: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
};

const buttonStyle = { // CONST-OK CSS style object
  display: 'block',
  width: '100%', // CONST-OK CSS full-width idiom
  marginTop: 'var(--spacing-3)', // CONST-OK CSS spacing token
  padding: 'var(--spacing-3) var(--spacing-4)', // CONST-OK CSS spacing tokens
  background: 'var(--color-accent, #4090E0)', // CONST-OK CSS fallback
  color: 'var(--color-text-on-accent, #fff)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-md)',
  cursor: 'pointer',
};

const secondaryButtonStyle = { ...buttonStyle, background: 'transparent', border: '1px solid var(--color-border-subtle, #1f2937)' }; // CONST-OK CSS fallback

export const SleepScreen = memo(function SleepScreen() {
  const summary = useGameStore((s) => s.pendingOfflineSummary);
  const dismiss = useGameStore((s) => s.dismissOfflineSummary);
  const chooseA = useGameStore((s) => s.chooseLucidDreamOptionA);
  const chooseB = useGameStore((s) => s.chooseLucidDreamOptionB);

  if (summary === null) return null;
  if (summary.elapsedMs < SYNAPSE_CONSTANTS.offlineModalMinSeconds * 1000) return null; // CONST-OK s→ms

  const eligibleForRewardedAd = summary.elapsedMs >= SYNAPSE_CONSTANTS.lucidDreamMinOfflineMinutes * 60_000; // CONST-OK min→ms
  const showGreeting = summary.elapsedMs >= SYNAPSE_CONSTANTS.lucidDreamMinOfflineMinutes * 60_000; // CONST-OK min→ms

  return (
    <div data-testid="sleep-screen" style={overlayStyle}>
      <div style={cardStyle}>
        {showGreeting && (
          <p data-testid="sleep-greeting" style={{ fontStyle: 'italic', opacity: 0.85, marginBottom: 'var(--spacing-3)' /* CONST-OK CSS subdued caption */ }}>
            {greetingForMoodTier(summary.avgMoodTier)}
          </p>
        )}
        <h2 style={titleStyle}>{t.title}</h2>

        <div data-testid="sleep-stats">
          <div style={statRowStyle}>
            <span>{t.elapsedLabel}</span>
            <span>{formatElapsed(summary.elapsedMs)}</span>
          </div>
          <div style={statRowStyle}>
            <span>{t.gainedLabel}</span>
            <span>{Math.floor(summary.gained).toLocaleString()}</span>
          </div>
          <div style={statRowStyle}>
            <span>{t.efficiencyLabel}</span>
            <span>×{summary.efficiency.toFixed(2)}</span>{/* CONST-OK 2-decimal display format */}
          </div>
        </div>

        {summary.cappedHit && (
          <p data-testid="sleep-capped-note" style={{ marginTop: 'var(--spacing-3)', opacity: 0.8 /* CONST-OK CSS fade */ }}>
            {t.cappedNote}
          </p>
        )}

        {summary.enhancedDischargeAvailable && (
          <p data-testid="sleep-enhanced-discharge-banner" style={{ marginTop: 'var(--spacing-3)', color: 'var(--color-warning, #ffb454)' /* CONST-OK CSS fallback */ }}>
            {t.enhancedDischargeBanner}
          </p>
        )}

        {summary.lucidDreamTriggered && (
          <div data-testid="sleep-lucid-dream-choice" style={{ marginTop: 'var(--spacing-4)' /* CONST-OK CSS spacing */ }}>
            <p style={{ marginBottom: 'var(--spacing-2)', fontStyle: 'italic' /* CONST-OK CSS spacing */ }}>{t.lucidDreamTitle}</p>
            <button data-testid="lucid-option-a" style={buttonStyle} onClick={() => chooseA(Date.now())}>
              {t.lucidDreamOptionA}
            </button>
            <button data-testid="lucid-option-b" style={secondaryButtonStyle} onClick={() => chooseB()}>
              {t.lucidDreamOptionB}
            </button>
          </div>
        )}

        {eligibleForRewardedAd && !summary.lucidDreamTriggered && (
          <button data-testid="sleep-rewarded-ad-stub" style={secondaryButtonStyle} onClick={() => { /* Sprint 9a wires the ad SDK */ }}>
            {t.rewardedAdButton}
          </button>
        )}

        {!summary.lucidDreamTriggered && (
          <button data-testid="sleep-dismiss" style={buttonStyle} onClick={() => dismiss()}>
            {t.dismissButton}
          </button>
        )}
      </div>
    </div>
  );
});
