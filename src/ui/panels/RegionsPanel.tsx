import { memo } from 'react';
import { t } from '../../config/strings';

/**
 * Regions tab panel shell (Sprint 3.6.4).
 *
 * Regions as a mechanic unlock at P0 via REG-1 (`cycleGenerated >=
 * 0.01 × threshold`) — the UI PANEL that surfaces them is what lands
 * in Sprint 5. Four of five regions are P0-available (Hipocampo,
 * Corteza Prefrontal, Sistema Límbico, Corteza Visual); Área de Broca
 * is the only P14-gated one. This shell exists so the Regions tab
 * doesn't crash when tapped before Sprint 5 builds the real content.
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
      <p style={{ marginTop: 'var(--spacing-3)' /* CONST-OK: CSS custom property ref */ }}>
        {t('panels.regions.shell_description')}
      </p>
    </section>
  );
});
