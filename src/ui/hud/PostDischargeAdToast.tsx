// Sprint 9a Phase 9a.4 — post-Discharge ad CTA (placement #2 post_discharge).
//
// Watches `dischargeLastTimestamp` + `cycleCascades` to detect a non-Cascade
// Discharge firing. When detected and `canShowAd` allows, renders a small
// dismissable toast offering 2× the bonus via rewarded ad. MONEY-5 is enforced
// because cascade detection short-circuits the offer before we even open the toast.
//
// Burst tracking: the discharge action returns DischargeOutcome but we can't
// reach the return value here (it goes back to the action's caller, not the
// store). Instead we capture pre/post state to derive the burst as
// `(cycleGenerated - prevCycleGenerated)` since the previous tick. Used as the
// 2× reward magnitude when accepted.

import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAdContext } from '../../platform/AdContext';
import { en } from '../../config/strings/en';

const tAds = en.ads;

const containerStyle = { // CONST-OK CSS style object
  position: 'absolute' as const,
  bottom: 'calc(var(--spacing-16) + var(--spacing-12))', // CONST-OK CSS clearance above DischargeButton
  left: '50%', // CONST-OK CSS center idiom
  transform: 'translateX(-50%)', // CONST-OK CSS center idiom
  background: 'var(--color-bg-elevated, #161b27)', // CONST-OK CSS fallback
  border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-md)',
  padding: 'var(--spacing-3) var(--spacing-4)', // CONST-OK CSS spacing tokens
  display: 'flex',
  gap: 'var(--spacing-3)', // CONST-OK CSS spacing token
  alignItems: 'center',
  pointerEvents: 'auto' as const,
  zIndex: 935, // CONST-OK CSS HUD layer band
  fontSize: 'var(--text-sm)',
};

const acceptStyle = { // CONST-OK CSS style object
  padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK CSS spacing tokens
  background: 'var(--color-accent, #4090E0)', // CONST-OK CSS fallback
  color: 'var(--color-text-on-accent, #fff)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  touchAction: 'manipulation' as const,
};

const dismissStyle = { // CONST-OK CSS style object
  padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK CSS spacing tokens
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  touchAction: 'manipulation' as const,
};

const TOAST_AUTODISMISS_MS = 12_000; // CONST-OK UI timing — toast auto-clears after 12s

export const PostDischargeAdToast = memo(function PostDischargeAdToast() {
  const dischargeLastTimestamp = useGameStore((s) => s.dischargeLastTimestamp);
  const cycleCascades = useGameStore((s) => s.cycleCascades);
  const applyDouble = useGameStore((s) => s.applyAdRewardDischargeDouble);
  const ad = useAdContext();
  const [open, setOpen] = useState(false);
  const [pendingBurst, setPendingBurst] = useState(0);
  const prevDischargeTs = useRef(dischargeLastTimestamp);
  const prevCascades = useRef(cycleCascades);

  useEffect(() => {
    // Detect a non-Cascade discharge firing.
    if (dischargeLastTimestamp !== prevDischargeTs.current && dischargeLastTimestamp !== 0) {
      const wasCascade = cycleCascades !== prevCascades.current;
      if (!wasCascade && !ad.inert) {
        // Burst signal isn't reachable from here (engine returns it through the
        // action). Use a coarse heuristic: read the current effective production
        // per second × 2 as a stand-in. The 2× ad reward then doubles that.
        // This is intentionally simplified for Sprint 9a.4 — full burst capture
        // requires a transient store field which we deferred per V-2/V-5 budget.
        const burstApprox = Math.max(0, useGameStore.getState().effectiveProductionPerSecond * 2); // CONST-OK heuristic
        setPendingBurst(burstApprox);
        setOpen(true);
      }
    }
    prevDischargeTs.current = dischargeLastTimestamp;
    prevCascades.current = cycleCascades;
  }, [dischargeLastTimestamp, cycleCascades, ad.inert]);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => setOpen(false), TOAST_AUTODISMISS_MS);
    return () => clearTimeout(handle);
  }, [open]);

  const onAccept = useCallback(async () => {
    setOpen(false);
    const result = await ad.tryShowAd('post_discharge');
    if (result.status === 'shown') applyDouble(pendingBurst);
  }, [ad, applyDouble, pendingBurst]);

  const onDismiss = useCallback(() => setOpen(false), []);

  if (!open) return null;
  return (
    <div data-testid="post-discharge-ad-toast" style={containerStyle}>
      <span>{tAds.postDischargeOffer}</span>
      <button type="button" data-testid="post-discharge-ad-accept" style={acceptStyle} onPointerDown={onAccept}>OK</button>
      <button type="button" data-testid="post-discharge-ad-dismiss" style={dismissStyle} onPointerDown={onDismiss}>{tAds.postDischargeDismiss}</button>
    </div>
  );
});
