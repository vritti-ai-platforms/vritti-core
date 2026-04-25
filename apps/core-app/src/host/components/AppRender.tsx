import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { getTheme, PushNavigator, useTheme } from '@vritti/quantum-ui-native';
import { useMemo } from 'react';
import { AuthFlowProvider } from '../providers/AuthFlowProvider';
import { useAuth, useAuthSessionSnapshot } from '../providers/AuthProvider';
import { authenticatedRoutes, authRoutes } from '../routes';
import { StartupSplashScreen } from './StartupSplashScreen';

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

  return (
    <NavigationContainer theme={navTheme}>
      <PushNavigator initialRoute="HomeTabs" screens={authenticatedRoutes} />
    </NavigationContainer>
  );
};
