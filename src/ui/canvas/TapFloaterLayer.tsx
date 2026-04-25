// Sprint 10 Phase 10.6 — tap +X floater overlay.
//
// Mounted in App.tsx alongside NeuronCanvas. Subscribes to tapFloaterEvents
// pub/sub and renders one absolutely-positioned span per event. Each floater
// auto-removes after the CSS animation duration (400ms — matches keyframe
// in styles/accessibility.css). Auto-cap at 12 visible floaters to bound
// DOM growth under spam-tap conditions.

import { memo, useEffect, useState } from 'react';
import { subscribeTapFloater, type TapFloaterEvent } from './tapFloaterEvents';

const FLOATER_LIFETIME_MS = 400; // CONST-OK matches CSS keyframe duration in accessibility.css
const MAX_VISIBLE_FLOATERS = 12; // CONST-OK hard cap to bound DOM growth under tap-spam

export const TapFloaterLayer = memo(function TapFloaterLayer() {
  const [floaters, setFloaters] = useState<readonly TapFloaterEvent[]>([]);

  useEffect(() => {
    const unsub = subscribeTapFloater((event) => {
      setFloaters((prev) => {
        const next = [...prev, event];
        // Drop oldest when over cap.
        return next.length > MAX_VISIBLE_FLOATERS ? next.slice(next.length - MAX_VISIBLE_FLOATERS) : next;
      });
      // Auto-remove after the animation completes.
      window.setTimeout(() => {
        setFloaters((prev) => prev.filter((f) => f.id !== event.id));
      }, FLOATER_LIFETIME_MS);
    });
    return unsub;
  }, []);

  if (floaters.length === 0) return null;
  return (
    <div data-testid="tap-floater-layer" aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 920 /* CONST-OK CSS layering */ }}>
      {floaters.map((f) => (
        <span
          key={f.id}
          data-testid="tap-floater"
          className="tap-floater"
          style={{ left: `${f.x}px`, top: `${f.y}px` }} // CONST-OK CSS px positioning
        >
          +{f.amount}
        </span>
      ))}
    </div>
  );
});
