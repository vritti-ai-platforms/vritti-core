import { usePushNavigator } from '@vritti/quantum-ui-native';
import { BottomSheet, type BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { Card } from '@vritti/quantum-ui-native/Card';
import { CardPressable } from '@vritti/quantum-ui-native/CardPressable';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { useTheme } from '@vritti/quantum-ui-native/hooks';
import { SectionHeader } from '@vritti/quantum-ui-native/Label';
import { ListItem } from '@vritti/quantum-ui-native/ListItem';
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
        <View className="rounded-xl bg-card">
          <ListItem
            title="Profile"
            index={0}
            total={3}
            description="View your personal and organization details"
            onPress={() => push('AccountProfile')}
          />
          <ListItem
            title="Password"
            index={1}
            total={3}
            description="Review password management options"
            onPress={() => push('AccountPassword')}
          />
          <ListItem
            title="Sessions"
            index={2}
            total={3}
            description="See active sessions and sign-in activity"
            onPress={() => push('AccountSessions')}
          />
        </View>
      </View>

      <View className="gap-3">
        <SectionHeader title="Preferences" />
        <View className="rounded-xl bg-card">
          <ListItem
            title="Theme"
            description="Choose system, light, or dark appearance"
            onPress={() => void themeSheetRef.current?.present()}
          />
        </View>
      </View>

      <View className="gap-3">
        <SectionHeader title="Session" />
        <View className="rounded-xl bg-card">
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

      <BottomSheet ref={themeSheetRef} detents={['auto']} glass>
        <View className="gap-5 px-4 pb-8 pt-2">
          <View className="gap-1">
            <Text className="text-base font-semibold text-foreground">Appearance</Text>
            <Text className="text-sm text-muted-foreground">
              Currently {isDark ? 'Dark' : 'Light'} · {colorScheme} mode
            </Text>
          </View>
          <View className="flex-row gap-3">
            {(
              [
                {
                  value: 'system',
                  label: 'System',
                  hint: 'Follows device',
                  icon: { sfSymbol: 'gearshape', materialIcon: 'settings' },
                },
                {
                  value: 'light',
                  label: 'Light',
                  hint: 'Always light',
                  icon: { sfSymbol: 'sun.max', materialIcon: 'light-mode' },
                },
                {
                  value: 'dark',
                  label: 'Dark',
                  hint: 'Always dark',
                  icon: { sfSymbol: 'moon', materialIcon: 'dark-mode' },
                },
              ] as const
            ).map(({ value, label, hint, icon }) => (
              <CardPressable
                key={value}
                selected={themePreference === value}
                onPress={() => void setThemePreference(value)}
                className="flex-1 items-center gap-2 rounded-xl border border-border bg-card p-4"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <DynamicIcon icon={icon} size={20} className="text-foreground" />
                </View>
                <View className="items-center gap-0.5">
                  <Text className="text-[13px] font-semibold text-foreground">{label}</Text>
                  <Text className="text-center text-[11px] text-muted-foreground">{hint}</Text>
                </View>
              </CardPressable>
            ))}
          </View>
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
};
