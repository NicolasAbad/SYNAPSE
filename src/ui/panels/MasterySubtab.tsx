// Mind → Mastery sub-tab per GDD §38.3. Renders 4 section toggles (Mutations
// / Upgrades / Pathways / Archetypes) with per-entity cards showing name,
// level (0-10), current uses, and next-level preview. Locked/never-used
// entities show as "???" with the §38.3 "Use once to reveal" hint.

import { memo, useState, type CSSProperties } from 'react';
import { useGameStore } from '../../store/gameStore';
import { t } from '../../config/strings';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import {
  MASTERY_ENTITY_IDS,
  masteryLevel,
  masteryUses,
  type MasteryClass,
} from '../../engine/mastery';

const SECTIONS: readonly MasteryClass[] = ['mutation', 'upgrade', 'pathway', 'archetype'];

export const MasterySubtab = memo(function MasterySubtab() {
  const [section, setSection] = useState<MasteryClass>('mutation');
  const mastery = useGameStore((s) => s.mastery);

  return (
    <div data-testid="mastery-subtab" style={mastereSubtabWrapperStyle}>
      <h2 data-testid="mastery-title" style={masteryTitleStyle}>
        {t('mind_subtabs.mastery_title')}
      </h2>
      <SectionTabs active={section} onSelect={setSection} />
      <EntityGrid section={section} mastery={mastery} />
    </div>
  );
});

const mastereSubtabWrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-4)', // CONST-OK CSS token ref
};

const masteryTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-lg)',
  color: 'var(--color-text-primary)',
};

const sectionTabsRowStyle: CSSProperties = {
  display: 'flex',
  gap: 'var(--spacing-2)', // CONST-OK CSS token ref
  flexWrap: 'wrap',
};

const cardGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', // CONST-OK CSS idiom
  gap: 'var(--spacing-2)', // CONST-OK CSS token ref
};

const cardStyleBase: CSSProperties = {
  padding: 'var(--spacing-3)', // CONST-OK CSS token ref
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-1)', // CONST-OK CSS token ref
  minHeight: 'var(--spacing-16)', // CONST-OK token-spacing floor for touch + readability
};

const cardTitleStyle: CSSProperties = {
  fontWeight: 'var(--font-weight-bold)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-primary)',
};

const cardMetaStyle: CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-secondary)',
};

const cardMutedStyle: CSSProperties = {
  fontSize: 'var(--text-xs)',
  opacity: 0.65, // CONST-OK muted-sub-line opacity token
};

function SectionTabs({ active, onSelect }: { active: MasteryClass; onSelect: (s: MasteryClass) => void }) {
  return (
    <div data-testid="mastery-section-tabs" style={sectionTabsRowStyle}>
      {SECTIONS.map((s) => (
        <button
          key={s}
          type="button"
          data-testid={`mastery-section-${s}`}
          data-active={active === s}
          onPointerDown={() => onSelect(s)}
          style={{
            padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK CSS token refs
            background: active === s ? 'var(--color-primary)' : 'transparent',
            color: active === s ? 'var(--color-bg-deep)' : 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            fontWeight: active === s ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          {t(`mind_subtabs.mastery_section_${s}`)}
        </button>
      ))}
    </div>
  );
}

function EntityGrid({ section, mastery }: { section: MasteryClass; mastery: Record<string, number> }) {
  const ids = MASTERY_ENTITY_IDS[section];
  return (
    <div data-testid={`mastery-grid-${section}`} style={cardGridStyle}>
      {ids.map((id) => (
        <EntityCard key={id} id={id} mastery={mastery} />
      ))}
    </div>
  );
}

function EntityCard({ id, mastery }: { id: string; mastery: Record<string, number> }) {
  const state = { mastery };
  const uses = masteryUses(state, id);
  const level = masteryLevel(state, id);
  const atMax = level >= SYNAPSE_CONSTANTS.masteryMaxLevel;
  const revealed = uses > 0;
  return (
    <div data-testid={`mastery-card-${id}`} data-revealed={revealed} style={cardStyleBase}>
      <span style={cardTitleStyle}>{revealed ? id : '???'}</span>
      {revealed ? (
        <>
          <span style={cardMetaStyle}>
            {t('mind_subtabs.mastery_level_label')} {level}{atMax ? ` · ${t('mind_subtabs.mastery_max_level_suffix')}` : ''}
          </span>
          <span style={cardMutedStyle}>
            {Math.floor(uses)} {t('mind_subtabs.mastery_uses_label')}
          </span>
        </>
      ) : (
        <span style={cardMutedStyle}>{t('mind_subtabs.mastery_locked_hint')}</span>
      )}
    </div>
  );
}
