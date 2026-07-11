import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { useTheme } from '@vritti/quantum-ui-native/hooks';
import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { THEME_TOKENS } from '@vritti/quantum-ui-native/theme';
import { useMemo } from 'react';
import { AuthFlowProvider } from '../providers/AuthFlowProvider';
import { useAuth, useAuthSessionSnapshot } from '../providers/AuthProvider';
import { PermissionProvider, usePermissionContext } from '../providers/PermissionProvider';
import { authenticatedRoutes, authRoutes } from '../routes';
import { SiteSelectionScreen } from '../screens/site/SiteSelectionScreen';
import { StartupSplashScreen } from './StartupSplashScreen';

const siteSelectionRoutes: ReadonlyArray<PushScreenConfig<'SelectSite'>> = [
  { name: 'SelectSite', component: SiteSelectionScreen, title: 'Select site' },
];

// Gate between auth and feature nav: waits for sites, then asks which site to use when there's more than one.
const AuthenticatedGate = ({ navTheme }: { navTheme: Theme }) => {
  const { selectedSiteId, sites, isLoadingSites } = usePermissionContext();
  const { sessionOrigin } = useAuthSessionSnapshot();

  // Show splash while sites resolve and during the restore gap before auto-selecting the last-used site.
  if (isLoadingSites || sites.length === 0 || (!selectedSiteId && sessionOrigin !== 'login')) {
    return <StartupSplashScreen statusText="Loading your workspace" />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {selectedSiteId ? (
        <PushNavigator initialRoute="HomeTabs" screens={authenticatedRoutes} />
      ) : (
        <PushNavigator initialRoute="SelectSite" screens={siteSelectionRoutes} />
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
