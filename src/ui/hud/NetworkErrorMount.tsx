// Pre-launch audit Day 2 — wires NetworkErrorToast into the store.
//
// NetworkErrorToast itself is a controlled component (Sprint 3.6.5
// scaffold). This wrapper subscribes to GameStoreState.networkError,
// passes it as the `message`, and clears the field on dismiss.
// Auto-dismiss timeout is provided via the toast's own `durationMs`.

import { memo, useCallback } from 'react';
import { NetworkErrorToast } from './NetworkErrorToast';
import { useGameStore } from '../../store/gameStore';

const NETWORK_ERROR_AUTO_DISMISS_MS = 4000; // CONST-OK transient toast UX

export const NetworkErrorMount = memo(function NetworkErrorMount() {
  const networkError = useGameStore((s) => s.networkError);
  const setNetworkError = useGameStore((s) => s.setNetworkError);
  const onDismiss = useCallback(() => { setNetworkError(null); }, [setNetworkError]);
  return (
    <NetworkErrorToast
      message={networkError}
      onDismiss={onDismiss}
      durationMs={NETWORK_ERROR_AUTO_DISMISS_MS}
    />
  );
});
