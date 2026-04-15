type EventParams = Record<string, string | number | boolean>;

let firebaseAvailable = false;

export async function initAnalytics(): Promise<void> {
  try {
    const mod = await import('@capacitor-firebase/analytics');
    await mod.FirebaseAnalytics.setEnabled({ enabled: true });
    firebaseAvailable = true;
  } catch {
    firebaseAvailable = false;
  }
}

export async function trackEvent(name: string, params?: EventParams): Promise<void> {
  if (!firebaseAvailable) return;
  try {
    const mod = await import('@capacitor-firebase/analytics');
    await mod.FirebaseAnalytics.logEvent({ name, params: params ?? {} });
  } catch {
    // Network/SDK error: continue without throwing
  }
}
