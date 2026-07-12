import { Badge } from '@vritti/quantum-ui-native/Badge';
import { CardPressable } from '@vritti/quantum-ui-native/CardPressable';
import { Text } from '@vritti/quantum-ui-native/Text';
import { View } from 'react-native';
import type { InventoryItem } from '../../../../types/inventory-items';
import { trackingLabel, typeLabel } from '../../../../services/site/inventory-items';

interface InventoryItemCardProps {
  item: InventoryItem;
  onPress?: (item: InventoryItem) => void;
}

export function InventoryItemCard({ item, onPress }: InventoryItemCardProps) {
  return (
    <CardPressable className="gap-2 p-4" onPress={() => onPress?.(item)}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="font-mono text-xs text-muted-foreground" numberOfLines={1}>
            {item.code}
          </Text>
        </View>
        {item.uomSymbol ? (
          <Text className="text-sm font-medium text-muted-foreground">{item.uomSymbol}</Text>
        ) : null}
      </View>
      <View className="flex-row flex-wrap gap-2">
        <Badge variant="secondary">
          <Text className="text-xs font-medium text-secondary-foreground">{typeLabel(item.type)}</Text>
        </Badge>
        <Badge variant="outline">
          <Text className="text-xs font-medium text-foreground">{trackingLabel(item.tracking)}</Text>
        </Badge>
      </View>
    </CardPressable>
  );
}
