import { Alert as InfoAlert } from '@vritti/quantum-ui-native/Alert';
import { ProfileCard, SettingsRowCard } from '@vritti/quantum-ui-native/Card';
import { SectionHeader } from '@vritti/quantum-ui-native/Label';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { Alert, ScrollView, View } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import type { AccountDetailRoute } from './types';
import { getInitials } from './utils';

interface AccountHomeScreenProps {
  onNavigate?: (route: AccountDetailRoute) => void;
}

export const AccountHomeScreen = ({ onNavigate }: AccountHomeScreenProps) => {
  const { user, org, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out of this session?', [
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
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 p-4 pb-8">
      <ProfileCard
        initials={getInitials(user?.fullName)}
        name={user?.fullName ?? 'Account'}
        role={org?.name ?? user?.email}
      />

      <InfoAlert
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
            onPress={() => onNavigate?.('AccountProfile')}
            className="border-b border-border"
          />
          <SettingsRowCard
            label="Password"
            description="Review password management options"
            onPress={() => onNavigate?.('AccountPassword')}
            className="border-b border-border"
          />
          <SettingsRowCard
            label="Sessions"
            description="See active sessions and sign-in activity"
            onPress={() => onNavigate?.('AccountSessions')}
          />
        </View>
      </View>

      <View className="gap-3">
        <SectionHeader title="Preferences" />
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <SettingsRowCard
            label="Theme"
            description="Choose system, light, or dark appearance"
            onPress={() => onNavigate?.('AccountTheme')}
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
