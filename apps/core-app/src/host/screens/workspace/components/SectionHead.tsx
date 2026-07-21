import { Text } from '@vritti/quantum-ui-native/Text';
import { View } from 'react-native';

// Scope section header: uppercase label + optional count pill + a hairline that fills the row.
export const SectionHead = ({ label, count }: { label: string; count?: number }) => (
  <View className="mb-2 mt-2 flex-row items-center gap-3">
    <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</Text>
    {count !== undefined ? (
      <View className="rounded-full border border-border bg-card px-2">
        <Text className="text-xs text-muted-foreground">{count}</Text>
      </View>
    ) : null}
    <View className="h-px flex-1 bg-border" />
  </View>
);
