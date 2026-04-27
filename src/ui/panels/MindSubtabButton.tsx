// Mind subtab pill button — extracted from MindPanel.tsx to keep that file
// under the CODE-2 200-line cap after Pre-launch audit Dim M Phase 2 added
// the unlock-badge overlay.
//
// Pure presentational. State lives in MindPanel; this component receives
// `value`, `active`, `onSelect`, and `showUnlockBadge` as props.

import type { MindSubtabId } from '../../store/gameStore';
import { t } from '../../config/strings';

export function MindSubtabButton({
  value, active, onSelect, showUnlockBadge,
}: {
  value: MindSubtabId;
  active: boolean;
  onSelect: (s: MindSubtabId) => void;
  showUnlockBadge: boolean;
}) {
  return (
    <button
      type="button"
      data-testid={`mind-subtab-${value}`}
      data-unlock-badge={showUnlockBadge ? 'true' : 'false'}
      onPointerDown={() => onSelect(value)}
      style={{
        position: 'relative',
        // Sprint 4c Phase 4c.6 — tighter padding so 6 buttons fit on 420px-wide
        // viewports. CODE-4 tap-target = 48dp/44pt; spacing-12 = 48px.
        padding: 'var(--spacing-1) var(--spacing-2)', // CONST-OK
        minHeight: 'var(--spacing-12)', // CONST-OK: WCAG tap-target
        display: 'flex',
        alignItems: 'center',
        background: active ? 'var(--color-primary)' : 'transparent',
        color: active ? 'var(--color-bg-deep)' : 'var(--color-text-secondary)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-full)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-xs)',
        fontWeight: active ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
        cursor: 'pointer',
        touchAction: 'manipulation',
        whiteSpace: 'nowrap',
        flexShrink: 0, // CONST-OK: preserve button width inside scrollable flex row
      }}
    >
      {t(`mind_subtabs.${value}`)}
      {showUnlockBadge && (
        <span
          data-testid={`mind-subtab-${value}-unlock-badge`}
          aria-label="new"
          className="synapse-unlock-pulse"
          style={{
            position: 'absolute',
            top: -2, // CONST-OK: visual offset (negative to overlap border)
            right: -2, // CONST-OK
            width: 8, // CONST-OK: dot diameter
            height: 8, // CONST-OK
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary)',
            boxShadow: '0 0 8px var(--color-primary)', // CONST-OK: glow
          }}
        />
      )}
    </button>
  );
}
