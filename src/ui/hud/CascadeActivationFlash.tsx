// Pre-launch audit Tier 2 (A-1) — every-cascade visual celebration.
//
// Pairs with the existing FocusBar inline white flash + once-per-session
// CascadeFirstOverlay. This component fires on EVERY cascade with the
// thoughts-gained amount as the sublabel ("+12,500"). Existing 3-layer
// stack:
//   1. FocusBar inline flash (white, 200ms)             — every cascade
//   2. CascadeActivationFlash (this, cyan tint + amount) — every cascade
//   3. CascadeFirstOverlay ("CASCADE!" hero)            — first per session
//
// Reduced-motion: skipped (parity with the other two layers).

import { memo, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ActivationFlash } from './ActivationFlash';
import { subscribeCascadeAmount } from './cascadeFlashEvents';
import { formatNumber } from '../util/formatNumber';
import { t } from '../../config/strings';

const FLASH_DURATION_MS = 700; // CONST-OK UI timing — short enough to not block, long enough to read amount
const CASCADE_TINT = '#40D0D0'; // CONST-OK matches --color-cyan token (CSS var resolves at runtime; constant inline for tint math)

export const CascadeActivationFlash = memo(function CascadeActivationFlash() {
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const [trigger, setTrigger] = useState<{ id: number; label: string; subLabel?: string; tintColor: string } | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    let nextId = 1;
    const unsub = subscribeCascadeAmount((amount) => {
      setTrigger({
        id: nextId++,
        label: t('activation_flash.cascade'),
        subLabel: `+${formatNumber(amount)}`,
        tintColor: CASCADE_TINT,
      });
    });
    return unsub;
  }, [reducedMotion]);

  return (
    <ActivationFlash
      trigger={trigger}
      durationMs={FLASH_DURATION_MS}
      onComplete={() => setTrigger(null)}
      testId="cascade-activation-flash"
    />
  );
});
