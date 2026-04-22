import { memo, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { UPGRADES } from '../../config/upgrades';
import { canBuyUpgrade } from '../../store/purchases';
import { formatCurrency } from '../util/formatNumber';
import { t } from '../../config/strings';
import type { GameState } from '../../types/GameState';

type Section = 'affordable' | 'teaser' | 'locked';

interface ClassifiedUpgrade {
  id: string;
  cost: number;
  costCurrency: 'thoughts' | 'memorias';
  unlockPrestige: number;
  section: Section;
}

/**
 * Upgrades tab panel (Sprint 3.6.3 — full implementation).
 *
 * Lists non-owned upgrades sorted into three sections per GDD §29 Tab
 * Upgrades ordering rule: Affordable (green, can buy) → Teaser
 * (unlocked by prestige but not yet affordable) → Locked (prestige gate
 * not met). The "Blocked by Pathway" category from the GDD rule is
 * empty pre-Sprint-5 (Pathways land in Sprint 5) and is therefore
 * omitted from render until that sprint adds the fourth section.
 *
 * Already-owned upgrades are hidden entirely — the panel focuses on
 * purchase decisions. A future polish sprint can add an "Owned"
 * collapsible footer if useful.
 *
 * Cost display reflects Funciones Ejecutivas's −20 % modifier
 * automatically via `canBuyUpgrade` (which applies COST-1 before
 * returning). No new cost logic here.
 */
export const UpgradesPanel = memo(function UpgradesPanel() {
  const state = useGameStore((s) => s);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);

  const sections = useMemo(() => classifyUpgrades(state), [state]);

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
      <h2
        data-testid="panel-upgrades-title"
        style={{
          color: 'var(--color-text-primary)',
          fontSize: 'var(--text-lg)',
          margin: 0,
          marginBottom: 'var(--spacing-3)', // CONST-OK: CSS token ref
        }}
      >
        Upgrades
      </h2>

      {(['affordable', 'teaser', 'locked'] as const).map((section) => {
        const items = sections[section];
        if (items.length === 0) return null;
        return (
          <div
            key={section}
            data-testid={`panel-upgrades-section-${section}`}
            style={{ marginBottom: 'var(--spacing-3)' /* CONST-OK */ }}
          >
            <h3
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: '0.08em', // CONST-OK: CSS typographic idiom
                textTransform: 'uppercase',
                margin: 0,
                marginBottom: 'var(--spacing-2)', // CONST-OK
              }}
            >
              {t(`panels.upgrades.section_${section}`)}
            </h3>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-1)', // CONST-OK
              }}
            >
              {items.map((u) => (
                <UpgradeCard
                  key={u.id}
                  info={u}
                  onBuy={() => {
                    if (u.section === 'affordable') buyUpgrade(u.id, Date.now());
                  }}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
});

function classifyUpgrades(state: GameState): Record<Section, ClassifiedUpgrade[]> {
  const ownedIds = new Set(state.upgrades.filter((u) => u.purchased).map((u) => u.id));
  const affordable: ClassifiedUpgrade[] = [];
  const teaser: ClassifiedUpgrade[] = [];
  const locked: ClassifiedUpgrade[] = [];

  for (const def of UPGRADES) {
    if (ownedIds.has(def.id)) continue;
    const check = canBuyUpgrade(state, def.id);
    const item: ClassifiedUpgrade = {
      id: def.id,
      cost: check.cost,
      costCurrency: def.costCurrency,
      unlockPrestige: def.unlockPrestige,
      section: 'locked',
    };
    if (check.reason === 'ok') {
      item.section = 'affordable';
      affordable.push(item);
    } else if (check.reason === 'insufficient_funds') {
      item.section = 'teaser';
      teaser.push(item);
    } else if (check.reason === 'locked') {
      locked.push(item);
    }
  }

  // GDD §24 UPGRADES-1: sort by (currencyRank, cost) — Thoughts before Memorias,
  // then by cost ascending within each currency group. Fixes Sprint 6.8 Nico UX
  // finding: prior sort compared raw numbers, so 2-Memoria upgrades sorted before
  // 3000-Thought upgrades (2 < 3000), misleading the player about what to buy next.
  const byCurrencyThenCost = (a: ClassifiedUpgrade, b: ClassifiedUpgrade) => {
    const rankA = a.costCurrency === 'thoughts' ? 0 : 1;
    const rankB = b.costCurrency === 'thoughts' ? 0 : 1;
    if (rankA !== rankB) return rankA - rankB;
    return a.cost - b.cost;
  };
  affordable.sort(byCurrencyThenCost);
  teaser.sort(byCurrencyThenCost);
  locked.sort((a, b) => a.unlockPrestige - b.unlockPrestige);

  return { affordable, teaser, locked };
}

function UpgradeCard({ info, onBuy }: { info: ClassifiedUpgrade; onBuy: () => void }) {
  const name = t(`upgrades.${info.id}`);
  const affordable = info.section === 'affordable';
  const isLocked = info.section === 'locked';
  const currencySuffix = info.costCurrency === 'memorias' ? ' m' : '';

  return (
    <li
      data-testid={`panel-upgrades-row-${info.id}`}
      data-section={info.section}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-3)', // CONST-OK
        padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-subtle)',
        borderLeft: affordable ? '3px solid var(--color-rate-counter)' : '1px solid var(--color-border-subtle)', // CONST-OK: 3px accent width
        borderRadius: 'var(--radius-md)',
        borderStyle: isLocked ? 'dashed' : 'solid',
        opacity: isLocked ? 0.55 : 1, // CONST-OK: CSS locked opacity
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
          {isLocked ? '???' : name}
        </div>
        {/* Effect description — audit fix. Previously the card showed only
            the upgrade name + cost, leaving players guessing what each
            upgrade did. Hidden for locked (???) rows. */}
        {!isLocked && (
          <div
            data-testid={`panel-upgrades-desc-${info.id}`}
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-secondary)',
              marginTop: 2, // CONST-OK: tight spacing between title + desc
            }}
          >
            {t(`upgrades_desc.${info.id}`)}
          </div>
        )}
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-secondary)',
            marginTop: 2, // CONST-OK: tight spacing
            fontFamily: 'var(--font-mono)',
          }}
        >
          {isLocked
            ? `${t('panels.upgrades.locked_prefix')}${info.unlockPrestige}`
            : `${formatCurrency(info.cost)}${currencySuffix}`}
        </div>
      </div>
      {!isLocked ? (
        <button
          type="button"
          data-testid={`panel-upgrades-buy-${info.id}`}
          disabled={!affordable}
          onPointerDown={affordable ? onBuy : undefined}
          style={{
            padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK
            background: affordable ? 'var(--color-primary)' : 'transparent',
            color: affordable ? 'var(--color-bg-deep)' : 'var(--color-text-secondary)',
            border: `1px solid ${affordable ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            fontFamily: 'inherit',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: affordable ? 'pointer' : 'not-allowed',
            touchAction: 'manipulation',
            minWidth: 64, // CONST-OK: touch-target minimum width
          }}
        >
          {t('panels.upgrades.buy')}
        </button>
      ) : null}
    </li>
  );
}
