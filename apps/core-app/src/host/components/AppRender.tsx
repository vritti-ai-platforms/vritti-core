import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { getTheme, PushNavigator, type PushScreenConfig, ScreenLayout, useTheme } from '@vritti/quantum-ui-native';
import { useMemo } from 'react';
import { DynamicFeatureNavigator } from '../mf/DynamicFeatureNavigator';
import { useAuth, useAuthSessionSnapshot } from '../providers/AuthProvider';
import { PermissionProvider } from '../providers/PermissionProvider';
import { AccountPasswordScreen } from '../screens/account/AccountPasswordScreen';
import { AccountProfileScreen } from '../screens/account/AccountProfileScreen';
import { AccountSessionsScreen } from '../screens/account/AccountSessionsScreen';
import { AccountThemeScreen } from '../screens/account/AccountThemeScreen';
import type { HostAppRoute } from '../screens/account/types';
import { AuthFlowShell } from '../screens/auth/AuthFlowShell';
import { StartupSplashScreen } from './StartupSplashScreen';

const HomeTabsScreen = () => {
  return (
    <ScreenLayout>
      <PermissionProvider>
        <DynamicFeatureNavigator />
      </PermissionProvider>
    </ScreenLayout>
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
        ...getTheme(isDark ? 'dark' : 'light'),
      },
    }),
    [isDark],
  );

  const splashStatusText = useMemo(() => {
    if (phase === 'bootstrapping') return 'Checking your session';
    if (phase === 'awaitingStatus') return 'Loading your workspace';
    return 'Starting Vritti';
  }, [phase]);

  const authenticatedRoutes = useMemo<ReadonlyArray<PushScreenConfig<HostAppRoute>>>(
    () => [
      {
        name: 'HomeTabs',
        component: HomeTabsScreen,
      },
      {
        name: 'AccountProfile',
        title: 'Profile',
        component: AccountProfileScreen,
      },
      {
        name: 'AccountPassword',
        title: 'Password',
        component: AccountPasswordScreen,
      },
      {
        name: 'AccountSessions',
        title: 'Sessions',
        component: AccountSessionsScreen,
      },
      {
        name: 'AccountTheme',
        title: 'Theme',
        component: AccountThemeScreen,
      },
    ],
    [],
  );

  if (isLoading) {
    return <StartupSplashScreen statusText={splashStatusText} />;
  }

  if (!isAuthenticated) {
    return <AuthFlowShell />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <PushNavigator initialRoute="HomeTabs" screens={authenticatedRoutes} />
    </NavigationContainer>
  );
};
