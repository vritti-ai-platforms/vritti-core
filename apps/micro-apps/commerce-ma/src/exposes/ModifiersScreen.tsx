import { Text } from '@vritti/quantum-ui-native/Typography';
import { SafeAreaView, View } from 'react-native';

/**
 * Modifiers feature screen — exposed via Module Federation as './Modifiers'.
 */
export default function ModifiersScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <Text className="text-2xl font-bold text-foreground">Modifiers</Text>
      <Text className="text-sm text-muted-foreground mt-1">Configure item modifiers and options</Text>

      <View className="mt-6 p-4 rounded-xl bg-card border border-border">
        <Text className="text-base font-medium text-card-foreground">Modifiers list will be loaded here</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          This screen is served from the commerce micro app via Module Federation.
        </Text>
      </View>
    </SafeAreaView>
  );
}
