import { usePushNavigator } from '@vritti/quantum-ui-native';
import { Alert } from '@vritti/quantum-ui-native/Alert';
import { ProfileCard, SettingsRowCard } from '@vritti/quantum-ui-native/Card';
import { SectionHeader } from '@vritti/quantum-ui-native/Label';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { Alert as NativeAlert, ScrollView, View } from 'react-native';
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
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 p-4 pb-28">
      <ProfileCard
        initials={getInitials(user?.fullName)}
        name={user?.fullName ?? 'Account'}
        role={org?.name ?? user?.email}
      />

      <Alert
        variant="info"
        title="Account"
        description="Manage your profile, security settings, theme preference, and session access from one place."
      />

      <View className="gap-3">
        <SectionHeader title="Account" />
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <SettingsRowCard
            label="Profile"
            description="View your personal and organization details"
            onPress={() => push('AccountProfile')}
            className="border-b border-border"
          />
          <SettingsRowCard
            label="Password"
            description="Review password management options"
            onPress={() => push('AccountPassword')}
            className="border-b border-border"
          />
          <SettingsRowCard
            label="Sessions"
            description="See active sessions and sign-in activity"
            onPress={() => push('AccountSessions')}
          />
        </View>
      </View>

      <View className="gap-3">
        <SectionHeader title="Preferences" />
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <SettingsRowCard
            label="Theme"
            description="Choose system, light, or dark appearance"
            onPress={() => push('AccountTheme')}
          />
        </View>
      </View>

      <View className="gap-3">
        <SectionHeader title="Session" />
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <SettingsRowCard
            label="Logout"
            description="Sign out of this device and return to the login flow"
            onPress={handleLogout}
          />
        </View>
        <Text className="text-xs text-muted-foreground">
          You can always sign back in with your organization and existing credentials.
        </Text>
      </View>
    </ScrollView>
  );
};
