import { memo } from 'react';
import { ThoughtsCounter } from './ThoughtsCounter';
import { RateCounter } from './RateCounter';
import { DischargeCharges } from './DischargeCharges';
import { FocusBar } from './FocusBar';
import { ConsciousnessBar } from './ConsciousnessBar';
import { DischargeButton } from './DischargeButton';
import { TabBar } from './TabBar';

/**
 * HUD composition overlay. Absolute-positioned sibling of NeuronCanvas
 * in App.tsx. `pointer-events: none` on wrapper; interactive children
 * (TabBar, DischargeButton) re-enable locally.
 *
 * Layout per GDD §29 HUD Layout (Phase 4.9 corrected):
 *   TL — ThoughtsCounter
 *   TR — RateCounter
 *   TC — DischargeCharges
 *   Top horizontal — FocusBar (cyan)
 *   Right vertical — ConsciousnessBar (violet, conditional)
 *   Center bottom — DischargeButton (stub disabled in Phase 5)
 *   Bottom — TabBar (4 tabs)
 *
 * Safe area insets applied via TabBar (bottom) and ThoughtsCounter
 * (top handled via spacing-5 which accounts for notch-adjacent
 * devices; fine-tune in Phase 7 perf + device pass).
 */
export const HUD = memo(function HUD() {
  return (
    <div
      data-testid="hud-root"
      style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0, // CONST-OK: CSS full-bleed — Chrome 83 lacks inset shorthand
        pointerEvents: 'none',
        paddingTop: 'env(safe-area-inset-top, 0)',
        paddingLeft: 'env(safe-area-inset-left, 0)',
        paddingRight: 'env(safe-area-inset-right, 0)',
      }}
    >
      <ThoughtsCounter />
      <RateCounter />
      <DischargeCharges />
      <FocusBar />
      <ConsciousnessBar />
      <DischargeButton />
      <TabBar />
    </div>
  );
});
