import { memo, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { MindSubtabId } from '../../store/gameStore';
import { t } from '../../config/strings';
import { PatternTreeView } from './PatternTreeView';
import { DiarySubtab } from './DiarySubtab';
import { AchievementsSubtab } from './AchievementsSubtab';
import { MasterySubtab } from './MasterySubtab';
import { visibleMindSubtabsAt, FALLBACK_MIND_SUBTAB } from './mindSubtabVisibility';

/**
 * Mind tab panel — subtab router per Sprint 4b Phase 4b.4 (scope-addition
 * deferred from 3.6.4).
 *
 * Subtabs (7): home / patterns / archetypes / diary / achievements / resonance / mastery.
 * `home` is the default first-open view — renders nothing so the canvas +
 * HUD behind stay tappable. Non-home subtabs overlay the bottom-sheet area.
 * Subtab state is React-local — switching main tabs (mind→neurons→mind)
 * intentionally resets to `home` per default-first-open UX.
 *
 * Pre-launch audit Dimension M (M-3): subtabs are gated by prestige to keep
 * the start state sparse. P0 cold-start renders 2 subtabs (home + achievements
 * — achievements anchors a 0/N progress counter as a motivational baseline);
 * patterns + diary appear at P1; mastery at P5; archetypes at P7; resonance
 * at P13. The single source of truth is `visibleMindSubtabsAt` in
 * `mindSubtabVisibility.ts`.
 *
 * Patterns subtab (this sprint): basic Pattern Tree viz + PAT-3 reset. Other
 * subtabs render "Unlocks in Sprint X" placeholders until Sprint 5/6/7/8b.
 */

export const MindPanel = memo(function MindPanel() {
  // Subtab state lifted to Zustand (Sprint 4c Phase 4c.6.5) so sibling HUD
  // components can gate on it. See `UIState.activeMindSubtab` in gameStore.ts.
  const subtab = useGameStore((s) => s.activeMindSubtab);
  const setSubtab = useGameStore((s) => s.setActiveMindSubtab);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const visibleSubtabs = visibleMindSubtabsAt(prestigeCount);
  const showBody = subtab !== 'home';

  // M-3 snap-back: if the active subtab points to one that's no longer
  // visible (e.g., a save loaded with activeMindSubtab='resonance' at P0
  // before this gating shipped), snap back to home.
  useEffect(() => {
    if (!visibleSubtabs.includes(subtab)) setSubtab(FALLBACK_MIND_SUBTAB);
  }, [subtab, visibleSubtabs, setSubtab]);

  return (
    <>
      <MindSubtabBar subtab={subtab} visibleSubtabs={visibleSubtabs} onChange={setSubtab} />
      {showBody && visibleSubtabs.includes(subtab) && <MindSubtabBody subtab={subtab} />}
    </>
  );
});

function MindSubtabBar({
  subtab,
  visibleSubtabs,
  onChange,
}: {
  subtab: MindSubtabId;
  visibleSubtabs: MindSubtabId[];
  onChange: (s: MindSubtabId) => void;
}) {
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
        // Offset below HUD thoughts row AND the MemoriesCounter (added 4c.6.5,
        // sits at ~top 88px). Using two spacing-16 instead of spacing-16+8
        // so the subtab row clears the memories line without visually crowding.
        top: 'calc(env(safe-area-inset-top, 0) + var(--spacing-16) + var(--spacing-16))', // CONST-OK: CSS custom property math — below HUD + MemoriesCounter
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
      {visibleSubtabs.map((s) => (
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
  value: MindSubtabId;
  active: boolean;
  onSelect: (s: MindSubtabId) => void;
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
        // CODE-4 tap-target: Android/iOS guidance = 48dp / 44pt. `touchTargetMin`
        // token is 48px (src/ui/tokens.ts); spacing-12 maps to the same 3rem/48px.
        // Width stays intrinsic so chip row still scrolls on 360px viewports.
        minHeight: 'var(--spacing-12)', // CONST-OK: CSS custom property ref — WCAG tap-target
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
        flexShrink: 0, // CONST-OK: preserve button width inside the scrollable flex row
      }}
    >
      {t(`mind_subtabs.${value}`)}
    </button>
  );
}

function MindSubtabBody({ subtab }: { subtab: MindSubtabId }) {
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
      {subtab === 'diary' && <DiarySubtab />}
      {subtab === 'achievements' && <AchievementsSubtab />}
      {subtab === 'resonance' && <Placeholder keyName="mind_subtabs.resonance_placeholder" />}
      {subtab === 'mastery' && <MasterySubtab />}
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
