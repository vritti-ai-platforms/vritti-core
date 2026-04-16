import { NAV_THEME, useTheme } from '@vritti/quantum-ui-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthFlowShell } from './AuthFlowShell';
import { DynamicFeatureNavigator } from '../mf/DynamicFeatureNavigator';
import { PermissionProvider } from '../providers/PermissionProvider';
import { useAuth } from '../providers/AuthProvider';

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

  const navTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme : DefaultTheme).colors,
        ...NAV_THEME[isDark ? 'dark' : 'light'],
      },
    }),
    [isDark],
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
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
