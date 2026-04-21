import { memo } from 'react';

/**
 * Upgrades tab panel shell (Sprint 3.6.1).
 *
 * Full implementation lands in Sprint 3.6.3 — 35 upgrade cards
 * sorted per GDD §29 Tab Upgrades ordering rule (Affordable /
 * Teaser / Blocked-by-Pathway / Locked).
 */
export const UpgradesPanel = memo(function UpgradesPanel() {
  return (
    <section
      data-testid="panel-upgrades"
      aria-label="Upgrades"
      style={{
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <h2 data-testid="panel-upgrades-title" style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-lg)', margin: 0 }}>
        Upgrades
      </h2>
      <p style={{ marginTop: 'var(--spacing-3)' /* CONST-OK: CSS custom property ref */ }}>Panel content lands in Sprint 3.6.3.</p>
    </section>
  );
});
