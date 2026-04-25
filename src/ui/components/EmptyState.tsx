// Sprint 10 Phase 10.6 — generic EmptyState component for panel placeholders.
//
// Used by Regions panel pre-P5, Upgrades panel when nothing is affordable yet,
// and Mind subtabs that haven't unlocked. Centralizes empty-state styling so
// each panel's "nothing yet" branch becomes a one-liner.

import { memo, type ReactNode } from 'react';

export interface EmptyStateProps {
  /** Glyph or short emoji-like character; aria-hidden so screen readers skip it. */
  icon?: ReactNode;
  /** Required short title (one short sentence). */
  title: string;
  /** Optional secondary explanation. */
  body?: string;
  /** Hint about WHEN/HOW the section will unlock. */
  unlockHint?: string;
  testId?: string;
}

const wrapperStyle = { // CONST-OK CSS style object
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center' as const,
  padding: 'var(--spacing-6)', // CONST-OK CSS spacing token
  gap: 'var(--spacing-2)', // CONST-OK CSS spacing token
  color: 'var(--color-text-secondary, #9ca3af)', // CONST-OK CSS fallback
  minHeight: '160px', // CONST-OK CSS reserved height to avoid layout shift on swap
};

const iconStyle = { // CONST-OK CSS style object
  fontSize: 'var(--text-3xl)',
  opacity: 0.6, // CONST-OK CSS faded-state idiom
  marginBottom: 'var(--spacing-2)', // CONST-OK CSS spacing token
};

const titleStyle = { // CONST-OK CSS style object
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-lg)',
  color: 'var(--color-text-primary)',
  margin: 0,
};

const bodyStyle = { // CONST-OK CSS style object
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-secondary)',
  margin: 0,
  maxWidth: '320px', // CONST-OK CSS readable line-length cap
};

const hintStyle = { // CONST-OK CSS style object
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-tertiary, #6b7280)', // CONST-OK CSS fallback
  marginTop: 'var(--spacing-2)', // CONST-OK CSS spacing token
};

export const EmptyState = memo(function EmptyState({ icon, title, body, unlockHint, testId }: EmptyStateProps) {
  return (
    <div data-testid={testId ?? 'empty-state'} role="status" style={wrapperStyle}>
      {icon !== undefined && <div aria-hidden="true" style={iconStyle}>{icon}</div>}
      <h3 style={titleStyle}>{title}</h3>
      {body !== undefined && <p style={bodyStyle}>{body}</p>}
      {unlockHint !== undefined && <p style={hintStyle}>{unlockHint}</p>}
    </div>
  );
});
