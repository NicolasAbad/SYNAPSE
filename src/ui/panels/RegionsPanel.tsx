import { memo } from 'react';

/**
 * Regions tab panel shell (Sprint 3.6.1).
 *
 * Full implementation lands in Sprint 5 (Regions are a P5+ feature per
 * GDD §16). Until then, shows "Unlocks at P5" placeholder.
 */
export const RegionsPanel = memo(function RegionsPanel() {
  return (
    <section
      data-testid="panel-regions"
      aria-label="Regions"
      style={{
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <h2 data-testid="panel-regions-title" style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-lg)', margin: 0 }}>
        Regions
      </h2>
      <p style={{ marginTop: 'var(--spacing-3)' /* CONST-OK: CSS custom property ref */ }}>Regions unlock at P5. Sprint 5 builds the 5 brain-region panel.</p>
    </section>
  );
});
