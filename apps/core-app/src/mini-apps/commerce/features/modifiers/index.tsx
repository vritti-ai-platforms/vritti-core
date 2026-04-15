import React from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { Text } from '@vritti/quantum-ui-native/Typography';

/**
 * Modifiers feature screen — exposed via Module Federation as './Modifiers'.
 */
export default function ModifiersScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5 pt-4">
        <Text className="text-2xl font-bold text-foreground">Modifiers</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Configure item modifiers and options
        </Text>

        <View className="mt-6 p-4 rounded-xl bg-card border border-border">
          <Text className="text-base font-medium text-card-foreground">
            Modifiers list will be loaded here
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
