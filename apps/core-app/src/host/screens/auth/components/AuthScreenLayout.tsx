import { Button } from '@vritti/quantum-ui-native/Button';
import { COMMON_ICONS, DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { NAV_THEME, useTheme } from '@vritti/quantum-ui-native';
import { Text } from '@vritti/quantum-ui-native/Typography';
import * as React from 'react';
import { Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logo = require('../../../../../assets/vritti-logo.png');

interface AuthScreenLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  onBack?: () => void;
}

export function AuthScreenLayout({ title, subtitle, children, onBack }: AuthScreenLayoutProps) {
  const { isDark } = useTheme();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: NAV_THEME[isDark ? 'dark' : 'light'].background,
      }}
    >
      <View className="flex-1 bg-background px-5">
        <View className="h-12 flex-row items-center justify-between">
          <View className="w-10 items-start">
            {onBack ? (
              <Button
                variant="ghost"
                size="icon"
                onPress={onBack}
                className="h-10 w-10 rounded-full bg-muted/60"
              >
                <DynamicIcon icon={COMMON_ICONS.chevronLeft} size={20} className="text-foreground" />
              </Button>
            ) : null}
          </View>
          <View className="flex-1 items-center">
            <Image source={logo} className="w-9 h-9 rounded-lg" resizeMode="contain" />
          </View>
          <View className="w-10" />
        </View>
        <View className="h-6" />
        <Text className="text-xl font-semibold text-foreground text-center">{title}</Text>
        {subtitle ? <Text className="text-sm text-muted-foreground text-center mt-2">{subtitle}</Text> : null}
        <View className="h-8" />
        {children}
      </View>
    </SafeAreaView>
  );
}
