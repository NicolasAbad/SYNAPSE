import { memo, useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { t } from '../../config/strings';
import { ACHIEVEMENTS_BY_CATEGORY } from '../../config/achievements';
import { isAchievementHidden } from '../../engine/achievements';
import type { AchievementCategory, AchievementDef } from '../../types';

/**
 * Sprint 7 Phase 7.6 — Mind→Achievements subtab.
 *
 * Category-tabbed grid. Each card shows lock state:
 *   - Unlocked: full name + description + reward
 *   - Locked (non-hidden): name + "Locked" + reward (no description visible
 *     to preserve mystery for first encounters)
 *   - Locked + hidden (hid_*): "???" until unlocked (ACH-2)
 *
 * Sprint 10 polish will add filter chips + sort options.
 */
const CATEGORIES: AchievementCategory[] = ['cyc', 'meta', 'nar', 'hid', 'mas', 'reg'];

const CATEGORY_LABEL: Record<AchievementCategory, string> = {
  cyc: 'Cycle',
  meta: 'Meta',
  nar: 'Narrative',
  hid: 'Hidden',
  mas: 'Mastery',
  reg: 'Regions',
};

export const AchievementsSubtab = memo(function AchievementsSubtab() {
  const unlocked = useGameStore((s) => s.achievementsUnlocked);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory>('cyc');
  const items = ACHIEVEMENTS_BY_CATEGORY[activeCategory];
  const unlockedCount = useMemo(
    () => items.filter((a) => unlocked.includes(a.id)).length,
    [items, unlocked],
  );

  return (
    <div data-testid="achievements-subtab" aria-label="Achievements">
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} unlocked={unlocked} />
      <div
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-xs)',
          marginTop: 'var(--spacing-3)', // CONST-OK
          marginBottom: 'var(--spacing-2)', // CONST-OK
          letterSpacing: '0.08em', // CONST-OK
          textTransform: 'uppercase',
        }}
      >
        {CATEGORY_LABEL[activeCategory]} · {unlockedCount} / {items.length}
      </div>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'var(--spacing-2)', // CONST-OK
        }}
      >
        {items.map((def) => (
          <AchievementCard key={def.id} def={def} unlocked={unlocked} />
        ))}
      </ul>
    </div>
  );
});

function CategoryTabs({
  active,
  onChange,
  unlocked,
}: {
  active: AchievementCategory;
  onChange: (c: AchievementCategory) => void;
  unlocked: string[];
}) {
  return (
    <div
      data-testid="achievements-category-tabs"
      style={{
        display: 'flex',
        gap: 'var(--spacing-1)', // CONST-OK
        overflowX: 'auto',
        scrollbarWidth: 'none', // CONST-OK
      }}
    >
      {CATEGORIES.map((c) => {
        const items = ACHIEVEMENTS_BY_CATEGORY[c];
        const count = items.filter((a) => unlocked.includes(a.id)).length;
        return (
          <button
            key={c}
            type="button"
            data-testid={`achievements-tab-${c}`}
            data-active={active === c}
            onPointerDown={() => onChange(c)}
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK
              background: active === c ? 'var(--color-primary)' : 'transparent',
              color: active === c ? 'var(--color-bg-deep)' : 'var(--color-text-secondary)',
              border: `1px solid ${active === c ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              touchAction: 'manipulation',
              flexShrink: 0,
              minWidth: 64, // CONST-OK: tap-target
            }}
          >
            {CATEGORY_LABEL[c]} {count}/{items.length}
          </button>
        );
      })}
    </div>
  );
}

function AchievementCard({ def, unlocked }: { def: AchievementDef; unlocked: string[] }) {
  const isUnlocked = unlocked.includes(def.id);
  const showAsHidden = isAchievementHidden(def.id, unlocked);
  return (
    <li
      data-testid={`achievement-card-${def.id}`}
      data-unlocked={isUnlocked}
      style={{
        padding: 'var(--spacing-3)', // CONST-OK
        background: 'var(--color-bg-elevated)',
        border: `1px solid ${isUnlocked ? 'var(--color-rate-counter)' : 'var(--color-border-subtle)'}`,
        borderRadius: 'var(--radius-md)',
        opacity: isUnlocked ? 1 : 0.7, // CONST-OK
      }}
    >
      <div
        style={{
          color: 'var(--color-text-primary)',
          fontWeight: 'var(--font-weight-semibold)',
          fontSize: 'var(--text-sm)',
        }}
      >
        {showAsHidden ? '???' : t(`achievements.${def.id}.name`)}
      </div>
      <div
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-xs)',
          marginTop: 2, // CONST-OK: tight typography
        }}
      >
        {showAsHidden ? t('mind_subtabs.hidden_locked') : t(`achievements.${def.id}.description`)}
      </div>
      <div
        style={{
          color: isUnlocked ? 'var(--color-rate-counter)' : 'var(--color-text-secondary)',
          fontSize: 'var(--text-xs)',
          marginTop: 4, // CONST-OK: tight typography
          fontFamily: 'var(--font-mono)',
        }}
      >
        +{def.reward} {t('hud.sparks')}
      </div>
    </li>
  );
}
