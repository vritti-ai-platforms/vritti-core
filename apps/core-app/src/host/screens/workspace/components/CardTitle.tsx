import { Text } from '@vritti/quantum-ui-native/Text';
import { View } from 'react-native';

// Workspace card title: entity name with its (optional) short code alongside.
export const CardTitle = ({ name, code }: { name: string; code?: string | null }) => (
  <View className="flex-row flex-wrap items-baseline gap-x-2">
    <Text className="text-sm font-semibold text-foreground">{name}</Text>
    {code ? <Text className="text-xs text-muted-foreground">{code}</Text> : null}
  </View>
);
