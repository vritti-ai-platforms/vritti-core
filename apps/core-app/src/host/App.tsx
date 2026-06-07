import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetBackgroundScalerProvider, BottomSheetScaledScreen } from '@vritti/quantum-ui-native/BottomSheet';
import { ThemeProvider } from '@vritti/quantum-ui-native/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import { storage } from '../../quantum-ui-native.config';
import { AppRender } from './components/AppRender';
import { AuthProvider } from './providers/AuthProvider';

const queryClient = new QueryClient();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider storage={storage}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <BottomSheetBackgroundScalerProvider>
                <BottomSheetModalProvider>
                  <BottomSheetScaledScreen>
                    <AppRender />
                  </BottomSheetScaledScreen>
                </BottomSheetModalProvider>
              </BottomSheetBackgroundScalerProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
        {/* Portal target for popovers/overlays (e.g. Select); host-owned so all containers funnel here */}
        <PortalHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
