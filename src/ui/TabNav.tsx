import { memo, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { t, type StringKey } from '@/config/strings';
import { SYNAPSE_CONSTANTS } from '@/config/constants';

export type TabId = 'mind' | 'neurons' | 'upgrades' | 'regions';

interface TabSpec {
  id: TabId;
  labelKey: StringKey;
  isUnlocked: (thoughts: number, threshold: number) => boolean;
}

const TABS: readonly TabSpec[] = [
  { id: 'mind', labelKey: 'mind_tab', isUnlocked: () => true },
  { id: 'neurons', labelKey: 'neurons_tab', isUnlocked: (th) => th >= 10 },
  { id: 'upgrades', labelKey: 'upgrades_tab', isUnlocked: (th) => th >= 80 },
  {
    id: 'regions',
    labelKey: 'regions_tab',
    isUnlocked: (th, threshold) => th >= threshold * SYNAPSE_CONSTANTS.regionsUnlockPct,
  },
];

const SEEN_STORAGE_KEY = 'synapse:tabsSeen:v1';

function loadSeen(): Set<TabId> {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return new Set(['mind']);
    return new Set(JSON.parse(raw) as TabId[]);
  } catch {
    return new Set(['mind']);
  }
}

function saveSeen(seen: Set<TabId>): void {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(Array.from(seen)));
  } catch {
    /* ignore */
  }
}

const styles = {
  bar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    background: '#0a0d1a',
    borderTop: '1px solid #ffffff14',
    paddingBottom: 'env(safe-area-inset-bottom)',
    fontFamily: '-apple-system, "Segoe UI", sans-serif',
  },
  tab: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#7070a0',
    fontSize: 11,
    fontWeight: 600 as const,
    padding: '14px 0',
    cursor: 'pointer' as const,
    position: 'relative' as const,
  },
  tabActive: {
    color: '#8B7FE8',
  },
  badge: {
    position: 'absolute' as const,
    top: 6,
    right: '32%',
    minWidth: 16,
    height: 16,
    padding: '0 4px',
    borderRadius: 8,
    background: '#F0A030',
    color: '#03050C',
    fontSize: 9,
    fontWeight: 800 as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'synapsePulse 1.4s ease-in-out infinite',
  },
} as const;

const PULSE_KEYFRAMES = `@keyframes synapsePulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 #F0A03066; }
  50% { transform: scale(1.15); box-shadow: 0 0 8px 4px #F0A03000; }
}`;

interface TabNavProps {
  active: TabId;
  onSelect: (id: TabId) => void;
}

export const TabNav = memo(function TabNav({ active, onSelect }: TabNavProps) {
  const thoughts = useGameStore((s) => s.thoughts);
  const threshold = useGameStore((s) => s.currentThreshold);
  const [seen, setSeen] = useState<Set<TabId>>(() => loadSeen());
  const styleInjected = useRef(false);

  useEffect(() => {
    if (styleInjected.current) return;
    const el = document.createElement('style');
    el.textContent = PULSE_KEYFRAMES;
    document.head.appendChild(el);
    styleInjected.current = true;
  }, []);

  const handleSelect = (id: TabId): void => {
    if (!seen.has(id)) {
      const next = new Set(seen);
      next.add(id);
      setSeen(next);
      saveSeen(next);
    }
    onSelect(id);
  };

  return (
    <nav style={styles.bar} role="tablist">
      {TABS.map((tab) => {
        const unlocked = tab.isUnlocked(thoughts, threshold);
        if (!unlocked) {
          return <div key={tab.id} style={{ flex: 1 }} aria-hidden />;
        }
        const isActive = tab.id === active;
        const showBadge = !seen.has(tab.id);
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(tab.id)}
            style={{ ...styles.tab, ...(isActive ? styles.tabActive : {}) }}
          >
            {t(tab.labelKey)}
            {showBadge && <span style={styles.badge}>{t('new_badge')}</span>}
          </button>
        );
      })}
    </nav>
  );
});
