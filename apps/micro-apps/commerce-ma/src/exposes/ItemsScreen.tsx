import { Text } from '@vritti/quantum-ui-native/Typography';
import { SafeAreaView, View } from 'react-native';

/**
 * Items feature screen — exposed via Module Federation as './Items'.
 * Loaded dynamically by core-app when user navigates to the Items tab.
 */
export default function ItemsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <Text className="text-2xl font-bold text-foreground">Items</Text>
      <Text className="text-sm text-muted-foreground mt-1">Manage your inventory items</Text>

      <View className="mt-6 p-4 rounded-xl bg-card border border-border">
        <Text className="text-base font-medium text-card-foreground">Items list will be loaded here</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          This screen is served from the commerce micro app via Module Federation.
        </Text>
      </View>
    </SafeAreaView>
  );
}
