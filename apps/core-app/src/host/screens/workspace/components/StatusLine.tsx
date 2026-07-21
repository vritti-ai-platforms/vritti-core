import { Text } from '@vritti/quantum-ui-native/Text';
import { View } from 'react-native';

// Decorative "open" indicator + the site's current local time and timezone (like web).
export const StatusLine = ({ time, timezone }: { time: string; timezone: string }) => (
  <View className="mt-1.5 flex-row items-center gap-1.5">
    <View className="h-1.5 w-1.5 rounded-full bg-success" />
    <Text className="text-xs text-muted-foreground">Open</Text>
    <Text className="text-xs text-muted-foreground">{time}</Text>
    <Text numberOfLines={1} className="min-w-0 flex-1 text-xs text-muted-foreground">
      {timezone}
    </Text>
  </View>
);
