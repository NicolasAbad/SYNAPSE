import { memo, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../util/formatNumber';
import { t } from '../../config/strings';

/**
 * Undo toast for expensive purchases (UI-4, GDD §29).
 *
 * Fires when a player buys a neuron or upgrade whose cost exceeds 10 %
 * of the currency bank before the purchase. The refund state (purchase
 * snapshot + refund amount + expiresAt) is populated by
 * `store/purchases.ts` via `buyNeuron` / `buyUpgrade`. This component
 * is the sole renderer — it subscribes to `undoToast`, shows item
 * name + refund amount, fires `undoLastPurchase` on the UNDO button,
 * and auto-dismisses at `expiresAt` (default `undoToastDurationMs` =
 * 3 s). No GameState mutation here — cleanup is idempotent on unmount
 * or re-render with a newer toast.
 */
export const UndoToast = memo(function UndoToast() {
  const undoToast = useGameStore((s) => s.undoToast);
  const undoLastPurchase = useGameStore((s) => s.undoLastPurchase);
  const dismissUndoToast = useGameStore((s) => s.dismissUndoToast);

  useEffect(() => {
    if (!undoToast) return;
    const ms = Math.max(0, undoToast.expiresAt - Date.now());
    const timer = setTimeout(() => dismissUndoToast(), ms);
    return () => clearTimeout(timer);
  }, [undoToast, dismissUndoToast]);

  if (!undoToast) return null;

  const nameKey =
    undoToast.kind === 'neuron' ? `neurons.${undoToast.id}.name` : `upgrades.${undoToast.id}`;
  const prefixKey = undoToast.kind === 'neuron' ? 'undo.prefix_neuron' : 'undo.prefix_upgrade';

  return (
    <div
      data-testid="hud-undo-toast"
      role="status"
      style={{
        position: 'absolute',
        bottom: 'calc(var(--spacing-16) * 3)', // CONST-OK: above TabBar (CSS offset)
        left: '50%', // CONST-OK: CSS centering idiom (CODE-1 exception)
        transform: 'translateX(-50%)', // CONST-OK: CSS centering idiom
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-3)',
        padding: 'var(--spacing-2) var(--spacing-3)',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-medium)',
        borderRadius: 'var(--radius-full)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        pointerEvents: 'auto',
      }}
    >
      <span data-testid="hud-undo-toast-label">
        {`${t(prefixKey)} ${t(nameKey)} · −${formatCurrency(undoToast.refund)}`}
      </span>
      <button
        data-testid="hud-undo-toast-button"
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          undoLastPurchase();
        }}
        style={{
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          padding: 'var(--spacing-1) var(--spacing-2)',
          color: 'var(--color-rate-counter)',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 'var(--font-weight-semibold)',
          letterSpacing: '0.05em', // CONST-OK: CSS typographic idiom
          cursor: 'pointer',
          touchAction: 'manipulation',
        }}
      >
        {t('undo.button')}
      </button>
    </div>
  );
});
