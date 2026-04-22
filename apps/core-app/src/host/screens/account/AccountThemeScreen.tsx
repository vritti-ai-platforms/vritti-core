import { Alert } from '@vritti/quantum-ui-native/Alert';
import { BasicCard } from '@vritti/quantum-ui-native/Card';
import { SectionHeader } from '@vritti/quantum-ui-native/Label';
import { RadioGroup, RadioGroupItem } from '@vritti/quantum-ui-native/RadioGroup';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { useTheme } from '@vritti/quantum-ui-native/hooks';
import { ScrollView, View } from 'react-native';

export const AccountThemeScreen = () => {
  const { colorScheme, isDark, themePreference, setThemePreference } = useTheme();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 p-4 pb-8">
      <Alert
        variant="info"
        title="Theme preference"
        description={`Current appearance is ${isDark ? 'Dark' : 'Light'} (${colorScheme} mode).`}
      />

      <View className="gap-3">
        <SectionHeader title="Appearance" />
        <BasicCard
          title="Choose theme"
          description="Your selection is stored locally and applied across the host app."
        >
          <View className="gap-4">
            <RadioGroup value={themePreference} onValueChange={(value) => void setThemePreference(value as any)}>
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
        </BasicCard>
      </View>
    </ScrollView>
  );
};
