import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { View } from 'react-native';

/**
 * Modifiers feature screen — exposed via Module Federation as './Modifiers'.
 */
export default function ModifiersScreen() {
  return (
    <ScreenContainer scrollable contentContainerClassName="p-4 gap-4">
      <View>
        <Text className="text-2xl font-bold text-foreground">Modifiers</Text>
        <Text className="text-sm text-muted-foreground mt-1">Configure item modifiers and options</Text>
      </View>
      <View className="p-4 rounded-xl bg-card border border-border">
        <Text className="text-base font-medium text-card-foreground">Modifiers list will be loaded here</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          This screen is served from the commerce micro app via Module Federation.
        </Text>
      </View>
    </ScreenContainer>
  );
}
