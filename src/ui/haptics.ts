// Haptic feedback wrapper per CLAUDE.md CODE-8 + SPRINTS.md §Sprint 3.
// All calls are fire-and-forget + silently swallow errors so web/dev
// previews, jsdom tests, and devices without the plugin never crash.
//
// Sprint 3 Phase 4 wires hapticLight() into the tap handler. Phase 6
// adds medium (Discharge), heavy (Cascade), success (prestige), notification
// (Insight) at the relevant action boundaries.

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function hapticLight(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // No-op on web/dev/test/plugin-missing. Haptics are optional UX polish.
  }
}

export async function hapticMedium(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // No-op — see hapticLight.
  }
}

export async function hapticHeavy(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {
    // No-op — see hapticLight.
  }
}

export async function hapticSuccess(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // No-op — see hapticLight.
  }
}

export async function hapticWarning(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch {
    // No-op — see hapticLight.
  }
}
