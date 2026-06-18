import { ApolloProvider } from '@apollo/client/react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalHost } from '@rn-primitives/portal';
import { BottomSheetBackgroundScalerProvider, BottomSheetScaledScreen } from '@vritti/quantum-ui-native/BottomSheet';
import { ThemeProvider } from '@vritti/quantum-ui-native/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import { AppRender } from './components/AppRender';
import { apolloClient } from './config/apollo';
import { preferencesStorage } from './config/storage';
import { AuthProvider } from './providers/AuthProvider';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider storage={preferencesStorage}>
          <ApolloProvider client={apolloClient}>
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
