// Sprint 10 Phase 10.4 — Daily Login Bonus modal.
//
// Two states driven by the engine outcome:
//   - normal_claim / streak_reset → reward card + Claim button
//   - streak_save_eligible → "Save your streak?" with Watch-ad / Start-fresh buttons
//                              (subscribers auto-save silently and never see this state)
//
// Wired in App.tsx: opens on cold-mount + on resume when evaluateDailyLogin
// returns anything other than 'no_action'. Closes on Claim / Save / Reset.

import { memo, useCallback, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAdContext } from '../../platform/AdContext';
import { en } from '../../config/strings/en';
import type { DailyLoginOutcome } from '../../engine/dailyLogin';

const t = en.dailyLogin;

const overlayStyle = { // CONST-OK CSS style object
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(5, 7, 13, 0.92)', // CONST-OK CSS dim-overlay alpha
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 950, // CONST-OK above all other modals
  padding: 'var(--spacing-6)', // CONST-OK CSS spacing token
};

const cardStyle = { // CONST-OK CSS style object
  background: 'var(--color-bg-deep, #0a0e1a)', // CONST-OK CSS fallback
  border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-6)', // CONST-OK CSS spacing token
  maxWidth: '380px', // CONST-OK CSS max-width readable
  width: '100%', // CONST-OK CSS full-width
  textAlign: 'center' as const,
};

const titleStyle = { // CONST-OK CSS style object
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-weight-light)' as const,
  marginTop: 0,
  marginBottom: 'var(--spacing-2)', // CONST-OK CSS spacing token
};

const rewardStyle = { // CONST-OK CSS style object
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-3xl)',
  color: 'var(--color-accent, #4090E0)', // CONST-OK CSS fallback
  margin: 'var(--spacing-3) 0', // CONST-OK CSS spacing token
};

const captionStyle = { // CONST-OK CSS style object
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-secondary, #9ca3af)', // CONST-OK CSS fallback
  marginBottom: 'var(--spacing-3)', // CONST-OK CSS spacing token
};

const buttonStyle = { // CONST-OK CSS style object
  display: 'block',
  width: '100%', // CONST-OK CSS full-width
  marginTop: 'var(--spacing-3)', // CONST-OK CSS spacing token
  padding: 'var(--spacing-3) var(--spacing-4)', // CONST-OK CSS spacing tokens
  background: 'var(--color-accent, #4090E0)', // CONST-OK CSS fallback
  color: 'var(--color-text-on-accent, #fff)', // CONST-OK CSS fallback
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-md)',
  cursor: 'pointer',
};

const secondaryStyle = { ...buttonStyle, background: 'transparent', border: '1px solid var(--color-border-subtle, #1f2937)' }; // CONST-OK CSS fallback

export interface DailyLoginModalProps {
  outcome: DailyLoginOutcome;
  nowDate: string;
  onClose: () => void;
}

export const DailyLoginModal = memo(function DailyLoginModal({ outcome, nowDate, onClose }: DailyLoginModalProps) {
  const claimDailyLoginReward = useGameStore((s) => s.claimDailyLoginReward);
  const resolveStreakSave = useGameStore((s) => s.resolveStreakSave);
  const recordAdWatched = useGameStore((s) => s.recordAdWatched);
  const dailyLoginStreak = useGameStore((s) => s.dailyLoginStreak);
  const { tryShowAd } = useAdContext();
  const [adInFlight, setAdInFlight] = useState(false);

  const onClaim = useCallback(() => {
    claimDailyLoginReward(nowDate);
    onClose();
  }, [claimDailyLoginReward, nowDate, onClose]);

  const onSaveWithAd = useCallback(async () => {
    if (adInFlight) return;
    setAdInFlight(true);
    try {
      const res = await tryShowAd('streak_save');
      if (res.status === 'shown') {
        recordAdWatched(Date.now());
        resolveStreakSave(nowDate, 'ad');
      }
    } finally {
      setAdInFlight(false);
      onClose();
    }
  }, [adInFlight, tryShowAd, recordAdWatched, resolveStreakSave, nowDate, onClose]);

  const onResetStreak = useCallback(() => {
    resolveStreakSave(nowDate, 'reset');
    onClose();
  }, [resolveStreakSave, nowDate, onClose]);

  if (outcome.kind === 'no_action') return null;

  if (outcome.kind === 'streak_save_eligible' && !outcome.canAutoSave) {
    return (
      <div data-testid="daily-login-modal" role="dialog" aria-modal="true" style={overlayStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>{t.streakSaveTitle}</h2>
          <p style={captionStyle}>{t.streakSaveBody.replace('{{streak}}', String(dailyLoginStreak))}</p>
          <button type="button" data-testid="daily-login-save-ad" onClick={onSaveWithAd} disabled={adInFlight} style={buttonStyle}>
            {t.streakSaveAdButton}
          </button>
          <button type="button" data-testid="daily-login-reset" onClick={onResetStreak} style={secondaryStyle}>
            {t.streakSaveResetButton}
          </button>
        </div>
      </div>
    );
  }

  // normal_claim, streak_reset, or streak_save_eligible with canAutoSave (subscriber path —
  // store auto-resolves before showing this; modal renders the reward card to acknowledge).
  if (outcome.kind === 'normal_claim' || outcome.kind === 'streak_reset' || outcome.kind === 'streak_save_eligible') {
    return (
      <div data-testid="daily-login-modal" role="dialog" aria-modal="true" style={overlayStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>{t.title}</h2>
          <p style={captionStyle}>{t.rewardLabel.replace('{{day}}', String(outcome.rewardDay))}</p>
          <div data-testid="daily-login-reward" style={rewardStyle}>
            {t.sparksReward.replace('{{amount}}', String(outcome.rewardSparks))}
          </div>
          <p style={captionStyle}>{t.streakLabel.replace('{{streak}}', String(outcome.nextStreak))}</p>
          <button type="button" data-testid="daily-login-claim" onClick={onClaim} style={buttonStyle}>
            {t.claimButton}
          </button>
        </div>
      </div>
    );
  }

  return null;
});
