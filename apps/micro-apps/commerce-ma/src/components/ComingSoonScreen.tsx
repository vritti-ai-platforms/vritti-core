import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
import { View } from 'react-native';

export function ComingSoonScreen({ name }: { name: string }) {
  return (
    <ScreenContainer contentContainerClassName="flex-1 items-center justify-center p-6 gap-3">
      <View className="items-center gap-2">
        <Text className="text-2xl font-bold text-foreground">{name}</Text>
        <Text className="text-base font-medium text-primary">Coming Soon</Text>
        <Text className="text-sm text-muted-foreground text-center">
          This feature is available on the web. Mobile support is on the way.
        </Text>
      </View>
    </ScreenContainer>
  );
}
