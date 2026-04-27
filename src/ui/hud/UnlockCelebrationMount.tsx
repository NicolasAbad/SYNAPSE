// Pre-launch audit Dim M Phase 2 — detector that watches GameState for
// unacknowledged unlocks and surfaces ONE toast at a time.
//
// Behavior:
//   - On render, compute pendingUnlocks(state). If non-empty AND we have
//     not yet shown a toast for that key in this session (tracked in a
//     useRef), display the toast.
//   - Auto-dismiss after 3.5s (UnlockToast manages its own timer).
//   - Player can also tap the toast to dismiss it manually.
//   - Dismissing the toast does NOT acknowledge the unlock (that requires
//     a tab/subtab tap) — the persistent "New" badge remains until the
//     player engages with the new surface. This separation is intentional:
//     the toast catches attention, the badge carries the goal forward.
//
// Reload edge case: useRef resets on remount, so a player who reloads with
// a still-unacknowledged unlock will see the toast again. Acceptable
// trade-off (rare during active play, and the second exposure isn't
// disruptive at 3.5s).

import { memo, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { t } from '../../config/strings';
import { pendingUnlocks, type PendingUnlock } from './unlockNotifications';
import { UnlockToast } from './UnlockToast';
import { playSfx } from '../../platform/audio';

function messageFor(unlock: PendingUnlock): string {
  if (unlock.kind === 'tab') return t(`unlock_toast.tab_${unlock.id}`);
  return t(`unlock_toast.subtab_${unlock.id}`);
}

export const UnlockCelebrationMount = memo(function UnlockCelebrationMount() {
  const tabBadgesDismissed = useGameStore((s) => s.tabBadgesDismissed);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const shownThisSession = useRef<Set<string>>(new Set());
  const [active, setActive] = useState<PendingUnlock | null>(null);

  useEffect(() => {
    if (active !== null) return; // Toast already showing — don't queue more.
    const next = pendingUnlocks({ prestigeCount, tabBadgesDismissed })
      .find((u) => !shownThisSession.current.has(u.key));
    if (!next) return;
    shownThisSession.current.add(next.key);
    setActive(next);
    // Soft chime — uses the existing 'tap' SFX channel (no new asset, no
    // distracting new sound). Adapter handles audio context unlock + vol.
    playSfx('tap');
  }, [tabBadgesDismissed, prestigeCount, active]);

  return (
    <UnlockToast
      message={active === null ? null : messageFor(active)}
      onDismiss={() => setActive(null)}
    />
  );
});
