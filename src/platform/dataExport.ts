// Pre-launch audit H-1 — GDPR Article 15 data export.
//
// EU regulation requires users to obtain a copy of their personal data in a
// structured, commonly used and machine-readable format. This module provides
// the cross-platform export path called from Settings → Privacy → "Download
// Your Data".
//
// Strategy (no new Capacitor deps):
//   - Native: @capacitor/share with `text` field. Player picks destination
//     (Email / Files / Notes / etc.) from the OS share sheet.
//   - Web: programmatic Blob download via dynamically-created <a download>.
//   - Both: fallback to navigator.clipboard.writeText + caller surfaces a
//     toast informing the player the data was copied.
//
// Pure (no React, no store deps) — caller passes the GameState in. Returns a
// discriminated outcome the caller maps to UI feedback.

import { Capacitor } from '@capacitor/core';
import type { GameState } from '../types/GameState';

export type DataExportOutcome =
  | { kind: 'shared' }      // native Share.share dialog completed
  | { kind: 'downloaded' }  // web Blob download triggered
  | { kind: 'copied' }      // fallback: copied to clipboard
  | { kind: 'failed'; reason: string };

/**
 * Serialize the GameState into the canonical export payload — the same
 * shape we persist to Capacitor Preferences via saveGame.ts. Wrapping in
 * an envelope adds context (export timestamp + bundle id) so a cold support
 * ticket can identify the install version without spelunking the payload.
 */
export function serializeGameStateForExport(state: GameState, nowTimestamp: number): string {
  const envelope = {
    bundleId: 'com.nicoabad.synapse',
    exportedAt: nowTimestamp,
    schemaVersion: 'synapse.save.v1',
    state,
  };
  return JSON.stringify(envelope, null, 2); // CONST-OK: JSON pretty-print indent (standard 2-space, not a tunable)
}

/**
 * Attempt to share/download the export. The cascade:
 *   1. Native Capacitor: try Share.share({ text }). On success → 'shared'.
 *   2. Web (or native fallback): try a Blob download. On success → 'downloaded'.
 *   3. Both fail or environment lacks the API: try navigator.clipboard. On
 *      success → 'copied' (caller shows "Data copied to clipboard" toast).
 *   4. All paths fail → 'failed' with a reason.
 *
 * Never throws — every async path is wrapped (CODE-8).
 */
export async function exportGameState(payload: string, suggestedFilename = 'synapse-data.json'): Promise<DataExportOutcome> {
  // 1. Native Share.share — the canonical native path.
  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: 'Synapse — Your Data',
        text: payload,
        dialogTitle: 'Export your Synapse data',
      });
      return { kind: 'shared' };
    } catch (e) {
      // Native Share can fail (user cancel = silent in Capacitor; explicit
      // throw = surfaceable). Fall through to clipboard fallback below.
      console.warn('[dataExport] native Share.share failed:', e);
    }
  }

  // 2. Web Blob download — the canonical web path.
  if (typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = suggestedFilename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke after the download begins — slight delay so the click handler
      // resolves before the URL is invalidated.
      setTimeout(() => URL.revokeObjectURL(url), 1000); // CONST-OK: revoke-delay safety margin
      return { kind: 'downloaded' };
    } catch (e) {
      console.warn('[dataExport] Blob download failed:', e);
    }
  }

  // 3. Clipboard fallback — works in modern WebViews + secure contexts.
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(payload);
      return { kind: 'copied' };
    } catch (e) {
      return { kind: 'failed', reason: e instanceof Error ? e.message : 'clipboard write failed' };
    }
  }

  return { kind: 'failed', reason: 'No supported export path on this platform' };
}
