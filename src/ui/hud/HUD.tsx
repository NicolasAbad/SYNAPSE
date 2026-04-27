import { memo } from 'react';
import { ThoughtsCounter } from './ThoughtsCounter';
import { RateCounter } from './RateCounter';
import { MemoriesCounter } from './MemoriesCounter';
import { MoodIndicator } from './MoodIndicator';
import { ConnectionChip } from './ConnectionChip';
import { DischargeCharges } from './DischargeCharges';
import { FocusBar } from './FocusBar';
import { ConsciousnessBar } from './ConsciousnessBar';
import { DischargeButton } from './DischargeButton';
import { TabBar } from './TabBar';
import { UndoToast } from './UndoToast';
import { EmergenciaCapBanner } from './EmergenciaCapBanner';
import { AwakeningFlow } from './AwakeningFlow';
import { PendingDecisionFlow } from './PendingDecisionFlow';
import { SettingsButton } from './SettingsButton';
import { PostDischargeAdToast } from './PostDischargeAdToast';
import { OfferOrchestrator } from './OfferOrchestrator';
import { NetworkErrorMount } from './NetworkErrorMount';
import { CascadeFirstOverlay } from './CascadeFirstOverlay';
import { TabPanelContainer } from '../panels/TabPanelContainer';
import { NamedMomentPrompt } from '../modals/NamedMomentPrompt';

export interface HUDProps {
  /** Sprint 9a Phase 9a.2 — App owns the SettingsModal open-state; HUD renders the trigger. */
  onOpenSettings?: () => void;
}

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
export const HUD = memo(function HUD({ onOpenSettings }: HUDProps = {}) {
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
      <MemoriesCounter />
      <MoodIndicator />
      <RateCounter />
      <ConnectionChip />
      <DischargeCharges />
      <FocusBar />
      <ConsciousnessBar />
      <TabPanelContainer />
      <DischargeButton />
      <UndoToast />
      <EmergenciaCapBanner />
      <AwakeningFlow />
      <PendingDecisionFlow />
      <NamedMomentPrompt />
      <PostDischargeAdToast />
      <OfferOrchestrator />
      <NetworkErrorMount />
      <CascadeFirstOverlay />
      {onOpenSettings && <SettingsButton onOpen={onOpenSettings} />}
      <TabBar />
    </div>
  );
});
