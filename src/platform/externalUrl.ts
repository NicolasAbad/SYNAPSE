// Pre-launch audit Day 1 — external URL opener.
//
// Opens an http(s) URL in the device's default browser (Capacitor) or a
// new tab (web). Uses `window.open(url, '_system')` which Capacitor
// intercepts and routes to the OS browser via the `_system` target;
// in plain web, '_system' falls back to '_blank' behavior.
//
// No new dependencies. Avoids @capacitor/browser plugin (one fewer dep).
// Wrapped in try/catch per CODE-8 — never throws at the boundary.

export function openExternalUrl(url: string): void {
  if (!url || typeof url !== 'string') return;
  try {
    if (typeof window === 'undefined') return;
    window.open(url, '_system', 'noopener,noreferrer');
  } catch (err) {
    if (typeof console !== 'undefined') {
      console.error('[externalUrl] open failed', err);
    }
  }
}
