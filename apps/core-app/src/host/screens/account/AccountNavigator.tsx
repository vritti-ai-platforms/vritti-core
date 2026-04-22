import { Button } from '@vritti/quantum-ui-native/Button';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AccountHomeScreen } from './AccountHomeScreen';
import { AccountPasswordScreen } from './AccountPasswordScreen';
import { AccountProfileScreen } from './AccountProfileScreen';
import { AccountSessionsScreen } from './AccountSessionsScreen';
import { AccountThemeScreen } from './AccountThemeScreen';
import type { AccountDetailRoute } from './types';

const routeTitles: Record<AccountDetailRoute, string> = {
  AccountProfile: 'Profile',
  AccountPassword: 'Password',
  AccountSessions: 'Sessions',
  AccountTheme: 'Theme',
};

export const AccountNavigator = () => {
  const [route, setRoute] = useState<AccountDetailRoute | null>(null);

  const content = useMemo(() => {
    switch (route) {
      case 'AccountProfile':
        return <AccountProfileScreen />;
      case 'AccountPassword':
        return <AccountPasswordScreen />;
      case 'AccountSessions':
        return <AccountSessionsScreen />;
      case 'AccountTheme':
        return <AccountThemeScreen />;
      default:
        return <AccountHomeScreen onNavigate={setRoute} />;
    }
  }, [route]);

  if (!route) {
    return content;
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="outline" size="sm" onPress={() => setRoute(null)}>
          Back
        </Button>
        <Text className="text-base font-semibold text-foreground">{routeTitles[route]}</Text>
      </View>
      <View className="flex-1">{content}</View>
    </View>
  );
};
