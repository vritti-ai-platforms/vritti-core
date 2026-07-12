import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { useTheme } from '@vritti/quantum-ui-native/hooks';
import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { THEME_TOKENS } from '@vritti/quantum-ui-native/theme';
import { useMemo } from 'react';
import { AuthFlowProvider } from '../providers/AuthFlowProvider';
import { useAuth, useAuthSessionSnapshot } from '../providers/AuthProvider';
import { PermissionProvider, usePermissionContext } from '../providers/PermissionProvider';
import { authenticatedRoutes, authRoutes } from '../routes';
import { WorkspaceSelectionScreen } from '../screens/workspace/WorkspaceSelectionScreen';
import { StartupSplashScreen } from './StartupSplashScreen';

const workspaceSelectionRoutes: ReadonlyArray<PushScreenConfig<'SelectWorkspace'>> = [
  { name: 'SelectWorkspace', component: WorkspaceSelectionScreen, title: 'Select workspace' },
];

// Gate between auth and feature nav: waits for assignments, then asks which workspace to use.
const AuthenticatedGate = ({ navTheme }: { navTheme: Theme }) => {
  const { workspace, isLoadingSites } = usePermissionContext();
  const { sessionOrigin } = useAuthSessionSnapshot();

  // Show splash while assignments resolve and during the restore gap before auto-selecting the last-used workspace.
  if (isLoadingSites || (!workspace && sessionOrigin !== 'login')) {
    return <StartupSplashScreen statusText="Loading your workspace" />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {workspace ? (
        <PushNavigator initialRoute="HomeTabs" screens={authenticatedRoutes} />
      ) : (
        <PushNavigator initialRoute="SelectWorkspace" screens={workspaceSelectionRoutes} />
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
