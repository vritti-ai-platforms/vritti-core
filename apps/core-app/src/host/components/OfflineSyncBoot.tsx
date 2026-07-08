import { getOfflineSyncEngine, type OfflineSyncEvent, startOfflineSyncEngine } from '@vritti/quantum-ui-native/apollo';
import { useEffect } from 'react';
import { getToastAdapter } from '../config/toast';

// Starts the offline mutation sync engine and surfaces terminal replay failures as error toasts; renders nothing.
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
