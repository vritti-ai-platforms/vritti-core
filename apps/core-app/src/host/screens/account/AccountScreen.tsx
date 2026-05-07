import { usePushNavigator } from '@vritti/quantum-ui-native';
import { BottomSheet, type BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { Card } from '@vritti/quantum-ui-native/Card';
import { useTheme } from '@vritti/quantum-ui-native/hooks';
import { SectionHeader } from '@vritti/quantum-ui-native/Label';
import { ListItem } from '@vritti/quantum-ui-native/ListItem';
import { RadioGroup, RadioGroupItem } from '@vritti/quantum-ui-native/RadioGroup';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { useRef } from 'react';
import { Alert as NativeAlert, View } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import type { HostAppRoute } from '../../routes';
import { getInitials } from './utils';

export const AccountScreen = () => {
  const { user, org, logout } = useAuth();
  const { push } = usePushNavigator<HostAppRoute>();
  const { isDark, colorScheme, themePreference, setThemePreference } = useTheme();
  const themeSheetRef = useRef<BottomSheetRef>(null);

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

      <StaticAlert
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
            onPress={() => void themeSheetRef.current?.present()}
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

      <BottomSheet ref={themeSheetRef} detents={['auto']}>
        <View className="gap-4 px-4 pb-8 pt-2">
          <View className="gap-1">
            <Text className="text-base font-semibold text-foreground">Theme</Text>
            <Text className="text-sm text-muted-foreground">
              Current appearance is {isDark ? 'Dark' : 'Light'} ({colorScheme} mode).
            </Text>
          </View>
          <RadioGroup
            value={themePreference}
            onValueChange={(value) => void setThemePreference(value as 'system' | 'light' | 'dark')}
          >
            <View className="gap-4">
              <RadioGroupItem value="system" label="System" />
              <RadioGroupItem value="light" label="Light" />
              <RadioGroupItem value="dark" label="Dark" />
            </View>
          </RadioGroup>
          <Text className="text-sm leading-6 text-muted-foreground">
            Use System follows your device setting. Light and Dark force the app into a fixed appearance.
          </Text>
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
};
