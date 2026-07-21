import { ApolloProvider } from '@apollo/client/react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalHost } from '@rn-primitives/portal';
import { BottomSheetBackgroundScalerProvider, BottomSheetScaledScreen } from '@vritti/quantum-ui-native/BottomSheet';
import { ThemeProvider } from '@vritti/quantum-ui-native/theme';
import { UpsellSheetHost } from '@vritti/quantum-ui-native/Upsell';
import { use } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import { AppRender } from './components/AppRender';
import { OfflineSyncBoot } from './components/OfflineSyncBoot';
import { apolloClient, apolloReady } from './config/apollo';
import { preferencesStorage } from './config/storage';
import { AuthProvider } from './providers/AuthProvider';

export default function App() {
  // Suspend until the persisted Apollo snapshot is restored so first-render cache reads see persisted data.
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
                  {/* Global upsell sheet for plan-locked actions — presented imperatively via presentUpsellSheet */}
                  <UpsellSheetHost />
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
