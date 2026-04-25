// Sprint 10 Phase 10.1 — SettingsModal style tokens (data-only, no components).
// Split from widgets.tsx so react-refresh stays happy (HMR rule: a file should
// export only components OR only data/utils, not both).

import { type CSSProperties } from 'react';

export const overlayStyle: CSSProperties = { // CONST-OK CSS style object
  position: 'fixed',
  inset: 0,
  background: 'rgba(5, 7, 13, 0.92)', // CONST-OK CSS dim-overlay alpha
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 945, // CONST-OK above HUD, below splash
  padding: 'var(--spacing-6)', // CONST-OK CSS spacing token
};

export const cardStyle: CSSProperties = { // CONST-OK CSS style object
  background: 'var(--color-bg-deep, #0a0e1a)', // CONST-OK CSS fallback
  border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-6)', // CONST-OK CSS spacing token
  maxWidth: '480px', // CONST-OK CSS max-width readable
  width: '100%', // CONST-OK CSS full-width idiom
  maxHeight: '85vh', // CONST-OK CSS viewport-relative scroll cap
  overflowY: 'auto',
};

export const titleStyle: CSSProperties = { // CONST-OK CSS style object
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-weight-light)' as CSSProperties['fontWeight'],
  marginTop: 0,
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
};

export const sectionHeaderStyle: CSSProperties = { // CONST-OK CSS style object
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em', // CONST-OK CSS letter-spacing tracking
  color: 'var(--color-text-secondary, #9ca3af)', // CONST-OK CSS fallback
  marginTop: 'var(--spacing-5)', // CONST-OK CSS spacing token
  marginBottom: 'var(--spacing-2)', // CONST-OK CSS spacing token
};

export const rowStyle: CSSProperties = { // CONST-OK CSS style object
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 'var(--spacing-2) 0', // CONST-OK CSS spacing token
  gap: 'var(--spacing-3)', // CONST-OK CSS spacing token
};

export const buttonStyle: CSSProperties = { // CONST-OK CSS style object
  display: 'block',
  width: '100%', // CONST-OK CSS full-width idiom
  marginTop: 'var(--spacing-3)', // CONST-OK CSS spacing token
  padding: 'var(--spacing-3) var(--spacing-4)', // CONST-OK CSS spacing tokens
  background: 'var(--color-accent, #4090E0)', // CONST-OK CSS fallback
  color: 'var(--color-text-on-accent, #fff)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-md)',
  cursor: 'pointer',
};

export const secondaryButtonStyle: CSSProperties = { ...buttonStyle, background: 'transparent', border: '1px solid var(--color-border-subtle, #1f2937)' }; // CONST-OK CSS fallback
export const disabledButtonStyle: CSSProperties = { ...buttonStyle, opacity: 0.55, cursor: 'not-allowed' }; // CONST-OK CSS faded
export const statusLineStyle: CSSProperties = { marginTop: 'var(--spacing-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', minHeight: '1.5em' }; // CONST-OK CSS layout-shift guard
export const captionStyle: CSSProperties = { fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary, #6b7280)' }; // CONST-OK CSS fallback
export const labelStyle: CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', color: 'var(--color-text-primary)' };
