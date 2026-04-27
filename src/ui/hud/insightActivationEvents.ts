// Pre-launch audit Tier 2 (A-2) — Insight activation pub/sub.
//
// Insight activation happens in two engine sites (tickScheduler step 2.5 and
// tap.ts after tap-driven focus crossings). The store-level boundaries that
// call into those sites are the right place to publish the celebration
// signal — engine code can't fire side effects (CODE-9).
//
// Listener payload carries the level (1/2/3) so the consumer can color the
// flash by tier (Claro green / Profundo violet / Trascendente gold).

type InsightListener = (level: number) => void;

const listeners = new Set<InsightListener>();

export function publishInsightActivation(level: number): void {
  for (const fn of listeners) fn(level);
}

export function subscribeInsightActivation(fn: InsightListener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Test-only — drain subscribers between assertions. */
export function _resetInsightActivationListeners(): void {
  listeners.clear();
}
