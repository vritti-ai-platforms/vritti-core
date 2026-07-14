import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { useTheme } from '@vritti/quantum-ui-native/hooks';
import { PushNavigator } from '@vritti/quantum-ui-native/PushNavigator';
import { THEME_TOKENS } from '@vritti/quantum-ui-native/theme';
import { useMemo } from 'react';
import { AuthFlowProvider } from '../providers/AuthFlowProvider';
import { useAuth, useAuthSessionSnapshot } from '../providers/AuthProvider';
import { PermissionProvider, usePermissionContext } from '../providers/PermissionProvider';
import { authenticatedRoutes, authRoutes } from '../routes';
import { StartupSplashScreen } from './StartupSplashScreen';

// Gate between auth and feature nav: waits for assignments, then renders ONE native-stack with HomeTabs +
// SelectWorkspace as siblings. The detached tab-bar button pushes SelectWorkspace (native slide-in); picking
// a workspace pops back to HomeTabs. A fresh login with a real choice starts on SelectWorkspace.
const AuthenticatedGate = ({ navTheme }: { navTheme: Theme }) => {
  const { workspace, isLoadingSites } = usePermissionContext();
  const { sessionOrigin } = useAuthSessionSnapshot();

  // Splash while assignments resolve, and during the restore gap before the last-used workspace is
  // auto-selected (so the picker isn't flashed). On a fresh login the workspace stays null → start on the picker.
  if (isLoadingSites || (!workspace && sessionOrigin !== 'login')) {
    return <StartupSplashScreen statusText="Loading your workspace" />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <PushNavigator initialRoute={workspace ? 'HomeTabs' : 'SelectWorkspace'} screens={authenticatedRoutes} />
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
