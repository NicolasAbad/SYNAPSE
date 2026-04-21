import { memo } from 'react';
import type { TabId } from '../../store/gameStore';

/**
 * Tab badge dot — rendering layer for GDD §29 UI-3.
 *
 * UI-3 rule: max 1 tab badge visible at a time; priority
 *   (1) new feature unlock > (2) affordable upgrade not yet purchased >
 *   (3) Discharge charge ready > (4) active mission/challenge.
 * Dismissed badges persist in `tabBadgesDismissed: string[]` (RESETS per
 * GDD §33). Clears on tab opened.
 *
 * Sprint 3.6.5 ships the RENDERING ONLY — a small dot overlay that can
 * be positioned on any of the 4 tab buttons via the `tab` prop, toggled
 * by `visible`. The priority-feed logic (which tab should actually show
 * a badge right now) lands in Sprint 7 alongside Achievements and
 * Mental States — the features that drive most badge events.
 *
 * Until Sprint 7 wires the feed, this component never renders (the
 * wiring calls pass `visible={false}`). The tests in Sprint 3.6.5
 * cover the visible-path render purely as infrastructure verification.
 */
export const TabBadge = memo(function TabBadge({ tab, visible }: { tab: TabId; visible: boolean }) {
  if (!visible) return null;
  return (
    <span
      data-testid={`hud-tab-badge-${tab}`}
      aria-label={`${tab} has a new update`}
      role="status"
      style={{
        display: 'inline-block',
        width: 'var(--spacing-2)' /* CONST-OK: spacing token */,
        height: 'var(--spacing-2)' /* CONST-OK: spacing token */,
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-rate-counter)',
        marginLeft: 'var(--spacing-1)' /* CONST-OK: spacing token */,
        verticalAlign: 'middle',
      }}
    />
  );
});
