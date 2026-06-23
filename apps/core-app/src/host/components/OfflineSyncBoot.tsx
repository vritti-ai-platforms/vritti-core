import { getOfflineSyncEngine, type OfflineSyncEvent, startOfflineSyncEngine } from '@vritti/quantum-ui-native/apollo';
import { useEffect } from 'react';
import { getToastAdapter } from '../config/toast';

// Starts the offline mutation sync engine once mounted under <ApolloProvider> — i.e. after App's
// use(apolloReady) gate, so the rehydrated cache (incl. prior-session optimistic rows) is live before the
// first drain. Surfaces terminal replay failures (server rejected a queued write) as error toasts.
// Renders nothing.
export function OfflineSyncBoot(): null {
  useEffect(() => {
    startOfflineSyncEngine();
    const unsubscribe = getOfflineSyncEngine()?.subscribe((event: OfflineSyncEvent) => {
      if (event.type === 'entry-failed-terminal') {
        getToastAdapter()?.error(event.message);
      }
    });
    return () => unsubscribe?.();
  }, []);

  return null;
}
