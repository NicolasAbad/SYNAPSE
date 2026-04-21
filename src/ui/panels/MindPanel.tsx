import { memo, useState } from 'react';
import { t } from '../../config/strings';
import { PatternTreeView } from './PatternTreeView';

/**
 * Mind tab panel — subtab router per Sprint 4b Phase 4b.4 (scope-addition
 * deferred from 3.6.4).
 *
 * Subtabs (6): home / patterns / archetypes / diary / achievements / resonance.
 * `home` is the default first-open view — renders nothing so the canvas +
 * HUD behind stay tappable. Non-home subtabs overlay the bottom-sheet area.
 * Subtab state is React-local — switching main tabs (mind→neurons→mind)
 * intentionally resets to `home` per default-first-open UX.
 *
 * Patterns subtab (this sprint): basic Pattern Tree viz + PAT-3 reset. Other
 * subtabs render "Unlocks in Sprint X" placeholders until Sprint 5/6/7/8b.
 */
type MindSubtab = 'home' | 'patterns' | 'archetypes' | 'diary' | 'achievements' | 'resonance';

const NON_HOME_SUBTABS: MindSubtab[] = ['patterns', 'archetypes', 'diary', 'achievements', 'resonance'];

export const MindPanel = memo(function MindPanel() {
  const [subtab, setSubtab] = useState<MindSubtab>('home');
  const showBody = subtab !== 'home';

  return (
    <>
      <MindSubtabBar subtab={subtab} onChange={setSubtab} />
      {showBody && <MindSubtabBody subtab={subtab} />}
    </>
  );
});

function MindSubtabBar({ subtab, onChange }: { subtab: MindSubtab; onChange: (s: MindSubtab) => void }) {
  return (
    <div
      data-testid="mind-subtab-bar"
      style={{
        position: 'absolute',
        // Positioned BELOW the HUD thoughts counter + Discharge charges row
        // (top HUD bar occupies ~100px: spacing-5 + text-3xl + label + progress
        // subtitle). Max defined spacing var is spacing-16 (64px) — we add
        // spacing-8 (32px) via calc to reach 96px. Also offset from the left
        // to clear the thoughts counter column.
        top: 'calc(env(safe-area-inset-top, 0) + var(--spacing-16) + var(--spacing-8))', // CONST-OK: CSS custom property math — below HUD bar
        left: 'var(--spacing-4)', // CONST-OK: CSS custom property ref — indent past thoughts column
        right: 'var(--spacing-4)', // CONST-OK: CSS custom property ref
        display: 'flex',
        flexDirection: 'row',
        // Sprint 4c Phase 4c.6 — flex-start + overflow-x: auto lets the 6
        // subtab buttons scroll horizontally on narrow viewports (420 px).
        // Previously center-justified which clipped edges.
        justifyContent: 'flex-start',
        gap: 'var(--spacing-1)', // CONST-OK: CSS custom property ref — tighter gap for fit
        padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK: CSS custom property ref
        pointerEvents: 'auto',
        overflowX: 'auto',
        scrollbarWidth: 'none', // CONST-OK: Firefox hide-scrollbar
        zIndex: 880, // CONST-OK: above HUD, below modals
      }}
    >
      {(['home', ...NON_HOME_SUBTABS] as MindSubtab[]).map((s) => (
        <SubtabButton key={s} value={s} active={subtab === s} onSelect={onChange} />
      ))}
    </div>
  );
}

function SubtabButton({
  value,
  active,
  onSelect,
}: {
  value: MindSubtab;
  active: boolean;
  onSelect: (s: MindSubtab) => void;
}) {
  return (
    <button
      type="button"
      data-testid={`mind-subtab-${value}`}
      onPointerDown={() => onSelect(value)}
      style={{
        // Sprint 4c Phase 4c.6 — tighter padding so 6 buttons fit more comfortably
        // on 420px-wide viewports (iPhone SE / older Android baseline).
        padding: 'var(--spacing-1) var(--spacing-2)', // CONST-OK: CSS custom property ref
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
        flexShrink: 0, // CONST-OK: preserve button width inside the scrollable flex row
      }}
    >
      {t(`mind_subtabs.${value}`)}
    </button>
  );
}

function MindSubtabBody({ subtab }: { subtab: MindSubtab }) {
  return (
    <div
      data-testid={`mind-subtab-body-${subtab}`}
      style={{
        position: 'absolute',
        top: '30%', // CONST-OK: bottom-sheet idiom — leaves upper 30% for canvas + subtab bar
        bottom: 'calc(var(--spacing-16) * 2)', // CONST-OK: above Discharge + TabBar
        left: 0, // CONST-OK: CSS full-bleed
        right: 0, // CONST-OK: CSS full-bleed
        padding: 'var(--spacing-4)', // CONST-OK: CSS custom property ref
        background: 'var(--color-bg-deep)',
        borderTop: '1px solid var(--color-border-subtle)',
        overflowY: 'auto',
        pointerEvents: 'auto',
      }}
    >
      {subtab === 'patterns' && <PatternTreeView />}
      {subtab === 'archetypes' && <Placeholder keyName="mind_subtabs.archetypes_placeholder" />}
      {subtab === 'diary' && <Placeholder keyName="mind_subtabs.diary_placeholder" />}
      {subtab === 'achievements' && <Placeholder keyName="mind_subtabs.achievements_placeholder" />}
      {subtab === 'resonance' && <Placeholder keyName="mind_subtabs.resonance_placeholder" />}
    </div>
  );
}

function Placeholder({ keyName }: { keyName: string }) {
  return (
    <div
      data-testid="mind-subtab-placeholder"
      style={{
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--text-sm)',
        textAlign: 'center',
        padding: 'var(--spacing-8)', // CONST-OK: CSS custom property ref
      }}
    >
      {t(keyName)}
    </div>
  );
}
