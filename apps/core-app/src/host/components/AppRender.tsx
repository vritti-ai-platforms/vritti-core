import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { getTheme, useTheme } from '@vritti/quantum-ui-native';
import { useMemo } from 'react';
import { DynamicFeatureNavigator } from '../mf/DynamicFeatureNavigator';
import { useAuth, useAuthSessionSnapshot } from '../providers/AuthProvider';
import { PermissionProvider } from '../providers/PermissionProvider';
import { AuthFlowShell } from '../screens/auth/AuthFlowShell';
import { StartupSplashScreen } from './StartupSplashScreen';

function HomeScreen() {
  return (
    <PermissionProvider>
      <DynamicFeatureNavigator />
    </PermissionProvider>
  );
}

export function AppRender() {
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

  if (isLoading) {
    return <StartupSplashScreen statusText={splashStatusText} />;
  }

  if (!isAuthenticated) {
    return <AuthFlowShell />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <HomeScreen />
    </NavigationContainer>
  );
}
