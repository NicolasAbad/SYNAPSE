// Pre-launch audit Tier-2 item D — push permission soft-prompt modal.
//
// Audit finding: usePushRuntime previously called the OS native permission
// prompt directly at gate 1 (P1+) and gate 3 (P3+). On iOS, denying the
// native prompt is essentially permanent — re-asking is impossible without
// sending the user to OS Settings. Cohorts who get the prompt cold have a
// 30-40% deny rate; pre-qualifying with a "soft prompt" that explains WHY
// before the OS prompt fires drops the deny rate dramatically.
//
// Mechanism: usePushRuntime sets `pendingPushSoftPrompt = 1 | 3` instead of
// firing the native ask. This component renders when non-null, gives the
// player two CTAs, and only on Allow does it fire the native prompt.
// Maybe-Later still records the gate as asked so the prompt doesn't keep
// re-firing every prestige (player has decided FOR NOW, surfacing again
// would be nagging).

import { memo, useCallback, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { createPushScheduler } from '../../platform/pushScheduler';
import { en } from '../../config/strings/en';

const t = en.pushSoftPrompt;

const overlayStyle = { // CONST-OK CSS style object (no game numbers)
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(5, 7, 13, 0.94)', // CONST-OK dim-overlay alpha
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 948, // CONST-OK above HUD, parallel to other modals
  padding: 'var(--spacing-5)', // CONST-OK CSS spacing token
};

const cardStyle = { // CONST-OK CSS style object
  background: 'var(--color-bg-deep)',
  border: '1px solid var(--color-primary)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-6)', // CONST-OK CSS spacing token
  maxWidth: 420, // CONST-OK CSS readable width
  width: '100%', // CONST-OK CSS full-width idiom
  textAlign: 'center' as const,
};

const titleStyle = { fontSize: 'var(--text-xl)', margin: 0, marginBottom: 'var(--spacing-3)' /* CONST-OK */ };
const bodyStyle = { color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--spacing-5)' /* CONST-OK */ };
const buttonRowStyle = { display: 'flex', gap: 'var(--spacing-3)' /* CONST-OK */, justifyContent: 'center' };
const allowButtonStyle = {
  padding: 'var(--spacing-2) var(--spacing-5)', // CONST-OK
  background: 'var(--color-primary)',
  color: 'var(--color-bg-deep)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-weight-semibold)',
  cursor: 'pointer',
  touchAction: 'manipulation' as const,
  minHeight: 44, // CONST-OK WCAG tap target
};
const laterButtonStyle = {
  ...allowButtonStyle,
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-medium)',
};

const scheduler = createPushScheduler();

export const PushSoftPromptModal = memo(function PushSoftPromptModal() {
  const pendingPushSoftPrompt = useGameStore((s) => s.pendingPushSoftPrompt);
  const setPendingPushSoftPrompt = useGameStore((s) => s.setPendingPushSoftPrompt);
  const recordAsked = useGameStore((s) => s.recordNotificationPermissionAsked);
  const [working, setWorking] = useState(false);

  const onAllow = useCallback(async () => {
    if (pendingPushSoftPrompt === null) return;
    setWorking(true);
    try {
      await scheduler.ensurePermission();
      // Schedule the daily reminder right away — if the player allowed,
      // they want notifications, not just permission.
      await scheduler.scheduleDailyReminder();
    } finally {
      recordAsked(pendingPushSoftPrompt);
      setPendingPushSoftPrompt(null);
      setWorking(false);
    }
  }, [pendingPushSoftPrompt, recordAsked, setPendingPushSoftPrompt]);

  const onMaybeLater = useCallback(() => {
    if (pendingPushSoftPrompt === null) return;
    // Mark the gate as asked so the soft-prompt doesn't keep re-firing on
    // every prestige. The player has decided "not now" — surfacing again
    // would be nagging. Gate 3 may still fire later if it's still pending.
    recordAsked(pendingPushSoftPrompt);
    setPendingPushSoftPrompt(null);
  }, [pendingPushSoftPrompt, recordAsked, setPendingPushSoftPrompt]);

  if (pendingPushSoftPrompt === null) return null;

  return (
    <div data-testid="push-soft-prompt-modal" role="dialog" aria-modal="true" aria-labelledby="push-soft-prompt-title" style={overlayStyle}>
      <div style={cardStyle}>
        <h2 id="push-soft-prompt-title" data-testid="push-soft-prompt-title" style={titleStyle}>{t.title}</h2>
        <p style={bodyStyle}>{t.body}</p>
        <div style={buttonRowStyle}>
          <button
            type="button"
            data-testid="push-soft-prompt-later"
            disabled={working}
            onClick={onMaybeLater}
            style={laterButtonStyle}
          >
            {t.maybeLater}
          </button>
          <button
            type="button"
            data-testid="push-soft-prompt-allow"
            disabled={working}
            onClick={() => { void onAllow(); }}
            style={allowButtonStyle}
          >
            {t.allow}
          </button>
        </div>
      </div>
    </div>
  );
});
