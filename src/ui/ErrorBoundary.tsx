// Pre-launch audit Day 1 — top-level React ErrorBoundary.
//
// Catches uncaught render-time exceptions thrown anywhere in the App tree
// (e.g. malformed save migration, type mismatch in a deep component).
// Without this, a single bad render = blank white screen + uninstall.
//
// Reports to Crashlytics, then offers the player two recovery paths:
//   1. Reload — relaunch React tree (hopes it was transient).
//   2. Hard Reset — wipe save + reload (last-resort, user-initiated).
//
// Class component because React's hook-based ErrorBoundary doesn't exist;
// this is the canonical pattern (https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary).

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getCrashlytics } from '../platform/crashlytics';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Crashlytics call is fire-and-forget per CODE-8 boundary discipline.
    void getCrashlytics().recordError('ErrorBoundary.componentDidCatch', error);
    if (typeof console !== 'undefined') {
      console.error('[ErrorBoundary] caught:', error, info.componentStack);
    }
  }

  reload = (): void => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  hardReset = (): void => {
    // Synchronous best-effort — clear known save key + reload.
    try {
      const sessionKeys = Object.keys(localStorage ?? {});
      for (const k of sessionKeys) localStorage.removeItem(k);
    } catch { /* ignore — Capacitor Preferences cleared on next createDefaultState */ }
    if (typeof window !== 'undefined') window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div data-testid="error-boundary-fallback" role="alert" style={fallbackContainerStyle}>
        <h1 style={fallbackHeadingStyle}>Something went wrong</h1>
        <p style={fallbackParaStyle}>
          The app hit an unexpected error. Try reloading. If it keeps happening,
          a Hard Reset wipes your save and starts fresh.
        </p>
        {this.state.errorMessage && (
          <code data-testid="error-boundary-message" style={fallbackCodeStyle}>
            {this.state.errorMessage}
          </code>
        )}
        <div style={fallbackActionsRow}>
          <button type="button" data-testid="error-boundary-reload" onClick={this.reload} style={fallbackReloadStyle}>
            Reload
          </button>
          <button type="button" data-testid="error-boundary-hard-reset" onClick={this.hardReset} style={fallbackHardResetStyle}>
            Hard Reset
          </button>
        </div>
      </div>
    );
  }
}

// CONST-OK CSS style objects (no game numbers — all values are CSS-only).
const fallbackContainerStyle = {
  position: 'fixed' as const,
  top: 0, right: 0, bottom: 0, left: 0,
  background: '#05070d', // CONST-OK bg-deep
  color: '#e5e7eb', // CONST-OK text-primary
  padding: '24px', // CONST-OK CSS
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  alignItems: 'center',
  gap: '16px', // CONST-OK CSS
  fontFamily: 'system-ui, -apple-system, sans-serif',
  zIndex: 9999, // CONST-OK above everything
  textAlign: 'center' as const,
};
const fallbackHeadingStyle = { fontSize: '20px' /* CONST-OK CSS */, margin: 0 };
const fallbackParaStyle = { fontSize: '14px' /* CONST-OK CSS */, maxWidth: 360 /* CONST-OK CSS */, opacity: 0.85 /* CONST-OK CSS */, margin: 0 };
const fallbackCodeStyle = { fontSize: '11px' /* CONST-OK CSS */, opacity: 0.6 /* CONST-OK CSS */, maxWidth: 360 /* CONST-OK CSS */, wordBreak: 'break-all' as const };
const fallbackActionsRow = { display: 'flex', gap: '12px' /* CONST-OK CSS */ };
const fallbackReloadStyle = {
  minHeight: 44, // CONST-OK CSS touch target
  padding: '8px 16px', // CONST-OK CSS
  background: '#1f2937', // CONST-OK gray-800
  color: '#e5e7eb', // CONST-OK gray-200
  border: '1px solid #374151', // CONST-OK gray-700
  borderRadius: '6px', // CONST-OK CSS
  cursor: 'pointer',
};
const fallbackHardResetStyle = {
  minHeight: 44, // CONST-OK CSS touch target
  padding: '8px 16px', // CONST-OK CSS
  background: '#7f1d1d', // CONST-OK red-900
  color: '#fee2e2', // CONST-OK red-100
  border: '1px solid #b91c1c', // CONST-OK red-700
  borderRadius: '6px', // CONST-OK CSS
  cursor: 'pointer',
};
