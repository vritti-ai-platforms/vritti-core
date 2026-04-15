import '../../../../../global.css';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { Text } from '@vritti/quantum-ui-native/Typography';

/**
 * Categories feature screen — exposed via Module Federation as './Categories'.
 */
export default function CategoriesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5 pt-4 bg-blue-500">
        <Text className="text-2xl bg-red-500 font-bold text-foreground">Categories</Text>
        <Text className="text-sm  text-muted-foreground mt-1">
          Organize items by category
        </Text>

        <View className="mt-6 p-4 rounded-xl bg-card border border-border">
          <Text className="text-base font-medium text-card-foreground">
            Categories list will be loaded here
          </Text>
          <Text className="text-sm text-muted-foreground mt-1">
            This screen is served from the commerce micro app via Module
            Federation.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
