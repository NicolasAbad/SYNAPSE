// Sprint 6 Phase 6.3b — full narrative fragment renderer (GDD NARRATIVE.md).
// Replaces the Sprint 2 tutorial-only BASE-01 stub. Watches
// `narrativeFragmentsSeen` for newly-added ids and renders each in sequence
// with fade-in / hold / fade-out per NARR-2. First-read +1 Memory (NARR-8)
// is granted by the engine `applyFragmentRead` — this layer only renders.
//
// Era 3 "fragments" (id prefix `era3_`) are skipped here — they render via
// the fullscreen Era3EventModal (Phase 6.5), not as ambient canvas text.

import { memo, useEffect, useRef, useState } from 'react';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { useGameStore } from '../../store/gameStore';
import { MOTION } from '../tokens';
import { getFragment } from '../../engine/narrative';

type Phase = 'idle' | 'fading-in' | 'visible' | 'fading-out';

export const FragmentOverlay = memo(function FragmentOverlay() {
  const seen = useGameStore((s) => s.narrativeFragmentsSeen);
  const activeTab = useGameStore((s) => s.activeTab);
  const activeMindSubtab = useGameStore((s) => s.activeMindSubtab);

  const [queue, setQueue] = useState<readonly string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const prevSeenRef = useRef<Set<string>>(new Set(seen));

  // Diff narrativeFragmentsSeen → append new ids to queue. Skip era3_*.
  useEffect(() => {
    const prev = prevSeenRef.current;
    const newIds: string[] = [];
    for (const id of seen) {
      if (prev.has(id)) continue;
      if (id.startsWith('era3_')) continue;
      newIds.push(id);
    }
    prevSeenRef.current = new Set(seen);
    if (newIds.length > 0) setQueue((q) => [...q, ...newIds]);
  }, [seen]);

  // Pull next id from queue when idle. State-based queue ensures React picks
  // up dependency changes cleanly (refs don't trigger re-runs in test env).
  useEffect(() => {
    if (currentId !== null || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setCurrentId(next);
    setPhase('fading-in');
  }, [currentId, queue]);

  // Phase progression: fade-in → visible → fade-out → clear (triggers pick).
  useEffect(() => {
    if (currentId === null) return;
    if (phase === 'fading-in') {
      const t1 = setTimeout(() => setPhase('visible'), MOTION.durSlow);
      return () => clearTimeout(t1);
    }
    if (phase === 'visible') {
      const t2 = setTimeout(() => setPhase('fading-out'), SYNAPSE_CONSTANTS.narrativeFragmentDisplayMs);
      return () => clearTimeout(t2);
    }
    if (phase === 'fading-out') {
      const t3 = setTimeout(() => {
        setCurrentId(null);
        setPhase('idle');
      }, MOTION.durSlow);
      return () => clearTimeout(t3);
    }
    return undefined;
  }, [currentId, phase]);

  if (currentId === null || phase === 'idle') return null;
  // Hide while a non-Mind tab / non-home subtab is active so the fragment
  // doesn't cover panel content (Sprint 4c Phase 4c.6 precedent).
  if (activeTab !== 'mind' || activeMindSubtab !== 'home') return null;

  const def = getFragment(currentId);
  if (!def) return null;

  const opacity = phase === 'fading-out' ? 0 : 1; // CONST-OK: binary visible/hidden

  return (
    <div
      data-testid="fragment-overlay"
      data-fragment-id={currentId}
      data-phase={phase}
      style={{
        position: 'absolute',
        top: '25%', // CONST-OK: CSS positioning idiom
        left: 'var(--spacing-6)', // CONST-OK
        right: 'var(--spacing-6)', // CONST-OK
        textAlign: 'center',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--font-weight-light)',
        lineHeight: 1.65, // CONST-OK: NARRATIVE typography idiom
        letterSpacing: '0.02em', // CONST-OK: CSS typography idiom
        opacity,
        transition: `opacity ${MOTION.durSlow}ms ease-in-out`,
        pointerEvents: 'none',
        zIndex: 500, // CONST-OK: above canvas, below splash
      }}
    >
      {def.text}
    </div>
  );
});
