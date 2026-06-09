import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { useTheme } from '@vritti/quantum-ui-native/hooks';
import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { THEME_TOKENS } from '@vritti/quantum-ui-native/theme';
import { useMemo } from 'react';
import { AuthFlowProvider } from '../providers/AuthFlowProvider';
import { useAuth, useAuthSessionSnapshot } from '../providers/AuthProvider';
import { PermissionProvider, usePermissionContext } from '../providers/PermissionProvider';
import { authenticatedRoutes, authRoutes } from '../routes';
import { BusinessUnitSelectionScreen } from '../screens/business-unit/BusinessUnitSelectionScreen';
import { StartupSplashScreen } from './StartupSplashScreen';

// Single-screen stack for the post-login BU picker. It must run inside a NavigationContainer
// so ScreenContainer's scroll-restore (which reads the navigation object) works; it also gives
// the picker a native "Select business unit" header.
const businessUnitSelectionRoutes: ReadonlyArray<PushScreenConfig<'SelectBusinessUnit'>> = [
  { name: 'SelectBusinessUnit', component: BusinessUnitSelectionScreen, title: 'Select business unit' },
];

// Gate between auth and the feature nav: wait for the BUs, then ask which BU to use when there's
// more than one (PermissionProvider auto-selects a lone BU). Both branches render a navigator
// inside the NavigationContainer (React Navigation's conditional-navigator pattern) so every
// screen has a navigation object.
const AuthenticatedGate = ({ navTheme }: { navTheme: Theme }) => {
  const { selectedBuId, businessUnits, isLoadingBUs } = usePermissionContext();
  const { sessionOrigin } = useAuthSessionSnapshot();

  // Show the splash while BUs resolve, and during the brief restore gap where selectedBuId is
  // null but we're about to auto-select the last-used BU (sessionOrigin !== 'login') — so a
  // reload goes splash → features with no BU-picker flash. The picker shows only on fresh login.
  if (isLoadingBUs || businessUnits.length === 0 || (!selectedBuId && sessionOrigin !== 'login')) {
    return <StartupSplashScreen statusText="Loading your workspace" />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {selectedBuId ? (
        <PushNavigator initialRoute="HomeTabs" screens={authenticatedRoutes} />
      ) : (
        <PushNavigator initialRoute="SelectBusinessUnit" screens={businessUnitSelectionRoutes} />
      )}
    </NavigationContainer>
  );
};

export const AppRender = () => {
  const { isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const { phase } = useAuthSessionSnapshot();

  const navTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme : DefaultTheme).colors,
        ...THEME_TOKENS[isDark ? 'dark' : 'light'].palette,
      },
    }),
    [isDark],
  );

  const splashStatusText = useMemo(() => {
    if (phase === 'bootstrapping') return 'Checking your session';
    if (phase === 'awaitingStatus') return 'Loading your workspace';
    return 'Starting Vritti';
  }, [phase]);

  if (isLoading) {
    return <StartupSplashScreen statusText={splashStatusText} />;
  }

  if (!isAuthenticated) {
    return (
      <AuthFlowProvider>
        <NavigationContainer theme={navTheme}>
          <PushNavigator initialRoute="Deployment" screens={authRoutes} />
        </NavigationContainer>
      </AuthFlowProvider>
    );
  }

  // PermissionProvider wraps the authenticated tree so the picker + feature nav share state.
  return (
    <PermissionProvider>
      <AuthenticatedGate navTheme={navTheme} />
    </PermissionProvider>
  );
};
