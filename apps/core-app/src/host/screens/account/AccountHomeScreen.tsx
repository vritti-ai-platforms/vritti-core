import { usePushNavigator } from '@vritti/quantum-ui-native';
import { Alert } from '@vritti/quantum-ui-native/Alert';
import { Card } from '@vritti/quantum-ui-native/Card';
import { SectionHeader } from '@vritti/quantum-ui-native/Label';
import { ListItem } from '@vritti/quantum-ui-native/ListItem';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { Alert as NativeAlert, View } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import type { HostAppRoute } from '../../routes';
import { getInitials } from './utils';

export const AccountHomeScreen = () => {
  const { user, org, logout } = useAuth();
  const { push } = usePushNavigator<HostAppRoute>();

  const handleLogout = () => {
    NativeAlert.alert('Sign out', 'Are you sure you want to sign out of this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <ScreenContainer scrollable contentContainerClassName="gap-6 p-4 pb-28">
      <Card className="items-center gap-4 p-6">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
          <Text className="text-lg font-bold text-primary-foreground">{getInitials(user?.fullName)}</Text>
        </View>
        <View className="w-full items-center gap-1">
          <Text className="text-center text-[17px] font-semibold text-foreground">{user?.fullName ?? 'Account'}</Text>
          {(org?.name ?? user?.email) ? (
            <Text className="text-center text-[13px] text-muted-foreground">{org?.name ?? user?.email}</Text>
          ) : null}
        </View>
      </Card>

      <Alert
        variant="info"
        title="Account"
        description="Manage your profile, security settings, theme preference, and session access from one place."
      />

      <View className="gap-3">
        <SectionHeader title="Account" />
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          <ListItem
            title="Profile"
            description="View your personal and organization details"
            onPress={() => push('AccountProfile')}
            className="border-b border-border"
          />
          <ListItem
            title="Password"
            description="Review password management options"
            onPress={() => push('AccountPassword')}
            className="border-b border-border"
          />
          <ListItem
            title="Sessions"
            description="See active sessions and sign-in activity"
            onPress={() => push('AccountSessions')}
          />
        </View>
      </View>

      <View className="gap-3">
        <SectionHeader title="Preferences" />
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          <ListItem
            title="Theme"
            description="Choose system, light, or dark appearance"
            onPress={() => push('AccountTheme')}
          />
        </View>
      </View>

      <View className="gap-3">
        <SectionHeader title="Session" />
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          <ListItem
            title="Logout"
            description="Sign out of this device and return to the login flow"
            onPress={handleLogout}
          />
        </View>
        <Text className="text-xs text-muted-foreground">
          You can always sign back in with your organization and existing credentials.
        </Text>
      </View>
    </ScreenContainer>
  );
};
