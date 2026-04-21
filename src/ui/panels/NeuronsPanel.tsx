import { memo } from 'react';

/**
 * Neurons tab panel shell (Sprint 3.6.1).
 *
 * Full implementation lands in Sprint 3.6.2 — 5 rows with icon / count /
 * rate / next-cost / Buy ×1 ×10 Max per UI_MOCKUPS.html Screen 6 and
 * GDD §29 tab description.
 */
export const NeuronsPanel = memo(function NeuronsPanel() {
  return (
    <section
      data-testid="panel-neurons"
      aria-label="Neurons"
      style={{
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <h2 data-testid="panel-neurons-title" style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-lg)', margin: 0 }}>
        Neurons
      </h2>
      <p style={{ marginTop: 'var(--spacing-3)' /* CONST-OK: CSS custom property ref */ }}>Panel content lands in Sprint 3.6.2.</p>
    </section>
  );
});
