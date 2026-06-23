import { ApolloProvider } from '@apollo/client/react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalHost } from '@rn-primitives/portal';
import { BottomSheetBackgroundScalerProvider, BottomSheetScaledScreen } from '@vritti/quantum-ui-native/BottomSheet';
import { ThemeProvider } from '@vritti/quantum-ui-native/theme';
import { use } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import { AppRender } from './components/AppRender';
import { OfflineSyncBoot } from './components/OfflineSyncBoot';
import { apolloClient, apolloReady } from './config/apollo';
import { preferencesStorage } from './config/storage';
import { AuthProvider } from './providers/AuthProvider';

export default function App() {
  // Suspend (on the host's <Suspense> in index.tsx) until the persisted Apollo snapshot has been
  // restored, so cache-first / cache-only reads see persisted data on the very first render.
  use(apolloReady);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider storage={preferencesStorage}>
          <ApolloProvider client={apolloClient}>
            <OfflineSyncBoot />
            <AuthProvider>
              <BottomSheetBackgroundScalerProvider>
                <BottomSheetModalProvider>
                  <BottomSheetScaledScreen>
                    <AppRender />
                  </BottomSheetScaledScreen>
                </BottomSheetModalProvider>
              </BottomSheetBackgroundScalerProvider>
            </AuthProvider>
          </ApolloProvider>
        </ThemeProvider>
        {/* Portal target for popovers/overlays (e.g. Select); host-owned so all containers funnel here */}
        <PortalHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
