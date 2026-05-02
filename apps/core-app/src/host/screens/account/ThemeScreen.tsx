import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui-native/Card';
import { useTheme } from '@vritti/quantum-ui-native/hooks';
import { SectionHeader } from '@vritti/quantum-ui-native/Label';
import { RadioGroup, RadioGroupItem } from '@vritti/quantum-ui-native/RadioGroup';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { View } from 'react-native';

export const ThemeScreen = () => {
  const { colorScheme, isDark, themePreference, setThemePreference } = useTheme();

  return (
    <ScreenContainer scrollable contentContainerClassName="gap-6 p-4 pb-8">
      <StaticAlert
        variant="info"
        title="Theme preference"
        description={`Current appearance is ${isDark ? 'Dark' : 'Light'} (${colorScheme} mode).`}
      />

      <View className="gap-3">
        <SectionHeader title="Appearance" />
        <Card>
          <CardHeader>
            <CardTitle>Choose theme</CardTitle>
            <CardDescription>Your selection is stored locally and applied across the host app.</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </View>
    </ScreenContainer>
  );
};
