// Sprint 10 Phase 10.4 close — React glue for the local-notifications scheduler.
//
// Single hook called from <App /> that:
//   1. Asks for OS permission on the prestige cadence per Sprint 10:
//      - gate 1: after first prestige (prestigeCount 0 → ≥1)
//      - gate 3: after third prestige (≥3) if gate-1 was already passed
//      Both gates respect the `notificationsEnabled` Settings flag — if the
//      user opted out in Settings we never trigger the OS prompt.
//   2. Schedules the daily 6 PM reminder when permission granted +
//      notificationsEnabled. Re-schedules whenever notificationsEnabled flips
//      true. Calls cancelAll when notificationsEnabled flips false.
//   3. Schedules the offline-cap-reached push on visibilitychange→hidden
//      (player going to background) using currentOfflineCapHours from now.
//   4. Schedules the streak-about-to-break push on visibilitychange→hidden
//      when dailyLoginStreak > 0, firing at the configured hour the next day.
//
// All of this is no-op on web/test (createPushScheduler returns inert stubs).

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { createPushScheduler } from './pushScheduler';
import { SYNAPSE_CONSTANTS } from '../config/constants';

const scheduler = createPushScheduler();

export function usePushRuntime(): void {
  const notificationsEnabled = useGameStore((s) => s.notificationsEnabled);
  const notificationPermissionAsked = useGameStore((s) => s.notificationPermissionAsked);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const dailyLoginStreak = useGameStore((s) => s.dailyLoginStreak);
  const currentOfflineCapHours = useGameStore((s) => s.currentOfflineCapHours);
  const recordAsked = useGameStore((s) => s.recordNotificationPermissionAsked);
  // Pre-launch audit Tier-2 item D — push soft-prompt setter. Replaces the
  // direct native-OS-prompt call at gate 1/3 with a soft modal first.
  void recordAsked; // referenced inside soft-prompt modal; kept here so the
                    // import doesn't drift if an effect needs it later.
  const setPendingPushSoftPrompt = useGameStore((s) => s.setPendingPushSoftPrompt);
  // Starter Pack expiry inputs. The reminder
  // schedules on first appearance and cancels on purchase OR dismissal.
  const starterPackExpiresAt = useGameStore((s) => s.starterPackExpiresAt);
  const starterPackPurchased = useGameStore((s) => s.starterPackPurchased);
  const starterPackDismissed = useGameStore((s) => s.starterPackDismissed);

  const permissionGranted = useRef(false);

  // Notifications-enabled toggle: schedule on, cancel on off.
  useEffect(() => {
    if (!notificationsEnabled) {
      void scheduler.cancelAll();
      return;
    }
    void (async () => {
      const ok = await scheduler.ensurePermission();
      permissionGranted.current = ok;
      if (ok) await scheduler.scheduleDailyReminder();
    })();
  }, [notificationsEnabled]);

  // Permission ask cadence: gate 1 after first prestige, gate 3 after third.
  // Pre-launch audit Tier-2 item D — instead of asking the OS directly,
  // surface a soft-prompt modal that explains WHY notifications matter.
  // PushSoftPromptModal owns the Allow / Maybe-Later flow + the actual
  // ensurePermission call. Maybe-Later still records the gate as asked so
  // the soft prompt doesn't keep firing on every prestige.
  useEffect(() => {
    if (!notificationsEnabled) return;
    if (prestigeCount >= 1 && notificationPermissionAsked < SYNAPSE_CONSTANTS.notificationPermissionAskAtP1) {
      setPendingPushSoftPrompt(1);
    } else if (prestigeCount >= 3 && notificationPermissionAsked < SYNAPSE_CONSTANTS.notificationPermissionAskAtP3) {
      setPendingPushSoftPrompt(3);
    }
  }, [prestigeCount, notificationPermissionAsked, notificationsEnabled, setPendingPushSoftPrompt]);

  // Pre-launch audit Tier-2 item D — Starter Pack expiry reminder.
  // Schedules a one-shot push at expiresAt minus the configured offset.
  // Cancels when the player buys OR dismisses the offer (both stop the
  // value of the reminder). Permission gating is delegated to the scheduler
  // itself — Capacitor LocalNotifications no-ops without permission, and the
  // adapter inert-paths for web/test, so a redundant permission check here
  // would only block the real-mobile path before permissionGranted resolves.
  useEffect(() => {
    if (!notificationsEnabled) return;
    if (starterPackExpiresAt === 0) return;
    if (starterPackPurchased || starterPackDismissed) {
      void scheduler.cancelStarterPackExpiringSoon();
      return;
    }
    const fireAt = starterPackExpiresAt
      - SYNAPSE_CONSTANTS.starterPackExpiryReminderMinutesBefore * 60 * 1000; // CONST-OK min→ms conversion
    if (fireAt <= Date.now()) return;
    void scheduler.scheduleStarterPackExpiringSoon(fireAt);
  }, [notificationsEnabled, starterPackExpiresAt, starterPackPurchased, starterPackDismissed]);

  // visibilitychange→hidden: schedule the two one-shot pushes.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onVis = (): void => {
      if (document.visibilityState !== 'hidden') return;
      if (!notificationsEnabled || !permissionGranted.current) return;
      const now = Date.now();
      // Offline cap reached: fire when offline accrual would saturate.
      const capReachedAt = now + currentOfflineCapHours * 60 * 60 * 1000; // CONST-OK hr→ms
      void scheduler.scheduleOfflineCapReached(capReachedAt);
      // Streak about to break: fire at the daily reminder hour the next day so
      // the player has a window before midnight to claim. Only meaningful when
      // there's a streak worth saving.
      if (dailyLoginStreak > 0) {
        const fire = nextDailyHour();
        void scheduler.scheduleStreakAboutToBreak(fire.getTime());
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [notificationsEnabled, currentOfflineCapHours, dailyLoginStreak]);
}

function nextDailyHour(): Date {
  const now = new Date();
  const hour = SYNAPSE_CONSTANTS.dailyReminderHourLocal;
  const fire = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0); // CONST-OK Date ctor positional args
  if (fire.getTime() <= now.getTime()) fire.setDate(fire.getDate() + 1);
  return fire;
}
