import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import type { ConnectivityProvider } from '@vritti/quantum-ui-native/apollo';

// Adapts netinfo to quantum-ui-native's ConnectivityProvider; treats unknown (null) reachability as online.
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
