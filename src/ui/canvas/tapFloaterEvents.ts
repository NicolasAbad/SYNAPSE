// Sprint 10 Phase 10.6 — pub/sub for tap +X floaters.
//
// NeuronCanvas's tap handler computes the thoughts delta from the tap and
// publishes here. TapFloaterLayer subscribes and renders one short-lived
// "+N" floater per event at the tap coordinates. Decoupling via this small
// pub/sub keeps the canvas tap handler from coupling to a React state slice
// (and avoids polluting GameState — these events are pure UI feedback).
//
// `respectReducedMotion`: caller (canvas tap handler) checks the store flag
// and simply skips publish() when reducedMotion is on. Layer is unaware.

export interface TapFloaterEvent {
  readonly id: number;
  readonly x: number; // viewport-relative pixels
  readonly y: number;
  readonly amount: number; // delta thoughts gained on the tap
}

type Listener = (event: TapFloaterEvent) => void;

const listeners = new Set<Listener>();
let nextId = 1;

export function publishTapFloater(e: Omit<TapFloaterEvent, 'id'>): void {
  const event: TapFloaterEvent = { id: nextId++, ...e };
  for (const l of listeners) l(event);
}

export function subscribeTapFloater(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Test-only — wipe between tests. */
export function __resetTapFloaterEventsForTests(): void {
  listeners.clear();
  nextId = 1;
}
