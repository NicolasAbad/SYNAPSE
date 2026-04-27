// Sprint 10 Phase 10.4 — local-notifications adapter.
// Implements docs/GDD.md §26 retention + Sprint 10 SPRINTS.md scope:
//   "Push scheduler: 3 types (daily reminder, offline cap reached, streak
//    about to break). Respects platform permissions."
//
// 3 schedulers:
//   - schedule daily reminder at 6 PM local time (recurring)
//   - schedule offline cap reached (one-shot, fires when cap timestamp passes)
//   - schedule streak about to break (one-shot, fires day before missed-day window)
//
// Permission flow lives in Settings + the post-prestige hook (notificationPermissionAsked
// cadence per Sprint 10). This adapter only schedules — no permission UI.
//
// Inert when not native (Capacitor not running): every method no-ops + returns
// false. Wraps every async call in try/catch — never throws (CODE-8).

import { Capacitor } from '@capacitor/core';
import { SYNAPSE_CONSTANTS } from '../config/constants';

export interface PushScheduler {
  ensurePermission: () => Promise<boolean>;
  scheduleDailyReminder: () => Promise<void>;
  scheduleOfflineCapReached: (capReachedAtMs: number) => Promise<void>;
  scheduleStreakAboutToBreak: (fireAtMs: number) => Promise<void>;
  /** Pre-launch audit Tier-2 item D — fire a "Starter Pack expires soon"
   * push at the supplied wall-clock time (typically expiresAt - 24h). */
  scheduleStarterPackExpiringSoon: (fireAtMs: number) => Promise<void>;
  /** Cancel a previously-scheduled Starter Pack reminder (player bought
   * the pack OR offer expired). */
  cancelStarterPackExpiringSoon: () => Promise<void>;
  cancelAll: () => Promise<void>;
}

/** Build a local-notifications-backed scheduler. Returns inert no-op stubs on web/test. */
export function createPushScheduler(): PushScheduler {
  if (!Capacitor.isNativePlatform()) {
    return {
      ensurePermission: async () => false,
      scheduleDailyReminder: async () => {},
      scheduleOfflineCapReached: async () => {},
      scheduleStreakAboutToBreak: async () => {},
      scheduleStarterPackExpiringSoon: async () => {},
      cancelStarterPackExpiringSoon: async () => {},
      cancelAll: async () => {},
    };
  }

  const importPlugin = () => import('@capacitor/local-notifications');

  return {
    ensurePermission: async () => {
      try {
        const { LocalNotifications } = await importPlugin();
        const status = await LocalNotifications.checkPermissions();
        if (status.display === 'granted') return true;
        const requested = await LocalNotifications.requestPermissions();
        return requested.display === 'granted';
      } catch (e) {
        console.error('[pushScheduler] ensurePermission failed:', e);
        return false;
      }
    },

    scheduleDailyReminder: async () => {
      try {
        const { LocalNotifications } = await importPlugin();
        // Recurring daily fire at the configured local hour. on: { hour } pattern
        // is supported by Capacitor LocalNotifications (every: 'day' loops).
        const fireAt = nextDailyFireDate();
        await LocalNotifications.cancel({
          notifications: [{ id: SYNAPSE_CONSTANTS.notificationIdDailyReminder }],
        });
        await LocalNotifications.schedule({
          notifications: [{
            id: SYNAPSE_CONSTANTS.notificationIdDailyReminder,
            title: 'Synapse',
            body: 'Your mind is waiting — claim your daily bonus.',
            schedule: { at: fireAt, repeats: true, every: 'day' },
          }],
        });
      } catch (e) {
        console.error('[pushScheduler] scheduleDailyReminder failed:', e);
      }
    },

    scheduleOfflineCapReached: async (capReachedAtMs) => {
      try {
        const { LocalNotifications } = await importPlugin();
        await LocalNotifications.cancel({
          notifications: [{ id: SYNAPSE_CONSTANTS.notificationIdOfflineCapReached }],
        });
        await LocalNotifications.schedule({
          notifications: [{
            id: SYNAPSE_CONSTANTS.notificationIdOfflineCapReached,
            title: 'Synapse',
            body: 'Offline capacity full — your mind is at capacity.',
            schedule: { at: new Date(capReachedAtMs) },
          }],
        });
      } catch (e) {
        console.error('[pushScheduler] scheduleOfflineCapReached failed:', e);
      }
    },

    scheduleStreakAboutToBreak: async (fireAtMs) => {
      try {
        const { LocalNotifications } = await importPlugin();
        await LocalNotifications.cancel({
          notifications: [{ id: SYNAPSE_CONSTANTS.notificationIdStreakAboutToBreak }],
        });
        await LocalNotifications.schedule({
          notifications: [{
            id: SYNAPSE_CONSTANTS.notificationIdStreakAboutToBreak,
            title: 'Synapse',
            body: 'Your daily streak is about to break — open before midnight to save it.',
            schedule: { at: new Date(fireAtMs) },
          }],
        });
      } catch (e) {
        console.error('[pushScheduler] scheduleStreakAboutToBreak failed:', e);
      }
    },

    scheduleStarterPackExpiringSoon: async (fireAtMs) => {
      try {
        const { LocalNotifications } = await importPlugin();
        // Cancel-then-schedule pattern (mirrors the other one-shot pushes) so
        // a re-schedule with a different timestamp doesn't leave a stale entry.
        await LocalNotifications.cancel({
          notifications: [{ id: SYNAPSE_CONSTANTS.notificationIdStarterPackExpiringSoon }],
        });
        // No-op if the requested fire time is already in the past — Capacitor
        // would error or fire instantly otherwise.
        if (fireAtMs <= Date.now()) return;
        await LocalNotifications.schedule({
          notifications: [{
            id: SYNAPSE_CONSTANTS.notificationIdStarterPackExpiringSoon,
            title: 'Synapse — Starter Pack',
            body: 'Your Starter Pack offer expires in 24 hours.', // CONST-OK push body literal
            schedule: { at: new Date(fireAtMs) },
          }],
        });
      } catch (e) {
        console.error('[pushScheduler] scheduleStarterPackExpiringSoon failed:', e);
      }
    },

    cancelStarterPackExpiringSoon: async () => {
      try {
        const { LocalNotifications } = await importPlugin();
        await LocalNotifications.cancel({
          notifications: [{ id: SYNAPSE_CONSTANTS.notificationIdStarterPackExpiringSoon }],
        });
      } catch (e) {
        console.error('[pushScheduler] cancelStarterPackExpiringSoon failed:', e);
      }
    },

    cancelAll: async () => {
      try {
        const { LocalNotifications } = await importPlugin();
        await LocalNotifications.cancel({
          notifications: [
            { id: SYNAPSE_CONSTANTS.notificationIdDailyReminder },
            { id: SYNAPSE_CONSTANTS.notificationIdOfflineCapReached },
            { id: SYNAPSE_CONSTANTS.notificationIdStreakAboutToBreak },
            { id: SYNAPSE_CONSTANTS.notificationIdStarterPackExpiringSoon },
          ],
        });
      } catch (e) {
        console.error('[pushScheduler] cancelAll failed:', e);
      }
    },
  };
}

/** Compute the next Date when the daily-reminder hour fires (today if still upcoming, else tomorrow). */
function nextDailyFireDate(): Date {
  const now = new Date();
  const hour = SYNAPSE_CONSTANTS.dailyReminderHourLocal;
  const fire = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0); // CONST-OK Date ctor minutes/seconds/ms
  if (fire.getTime() <= now.getTime()) fire.setDate(fire.getDate() + 1);
  return fire;
}
