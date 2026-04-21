import { Text } from '@vritti/quantum-ui-native/Typography';
import { View } from 'react-native';

/**
 * Categories feature screen — exposed via Module Federation as './Categories'.
 */
export default function CategoriesScreen() {
  return (
    // <SafeAreaView style={{ flex: 1, backgroundColor: '#2563eb', padding: 16 }}>
    <>
      <Text className="text-2xl font-bold text-foreground">Categories</Text>
      <Text className="text-sm text-muted-foreground mt-1">Organize items by category</Text>
      <View className="mt-6 p-4 rounded-xl bg-card border border-border">
        <Text className="text-base font-medium text-card-foreground">Categories list will be loaded here</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          This screen is served from the commerce micro app via Module Federation.
        </Text>
      </View>
    </>
    // </SafeAreaView>
  );
}
