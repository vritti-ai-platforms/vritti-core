import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import type { ConnectivityProvider } from '@vritti/quantum-ui-native/apollo';

// Adapts @react-native-community/netinfo to quantum-ui-native's generic ConnectivityProvider so the
// package never depends on the native module. `isInternetReachable` is null (unknown) during the brief
// startup window — treat null as online to avoid spuriously queueing the first writes; a real send then
// failing re-queues via the engine's network-error path.
function isReachable(state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>): boolean {
  return state.isConnected !== false && state.isInternetReachable !== false;
}

let lastKnownOnline = true;

export const netInfoConnectivity: ConnectivityProvider = {
  subscribe(cb) {
    return NetInfo.addEventListener((state) => {
      const online = isReachable(state);
      if (online !== lastKnownOnline) {
        lastKnownOnline = online;
        cb(online);
      }
    });
  },
  getSnapshot() {
    return lastKnownOnline;
  },
};

// Prime the snapshot once at module load so the first enqueue decision reads a real value.
void NetInfo.fetch().then((state) => {
  lastKnownOnline = isReachable(state);
});
