import { Badge } from "@vritti/quantum-ui-native/Badge";
import { CardPressable } from "@vritti/quantum-ui-native/CardPressable";
import { Text } from "@vritti/quantum-ui-native/Text";
import { View } from "react-native";
import type { UomDimension } from "../../../../types/uom-dimensions";

interface UomDimensionCardProps {
  dimension: UomDimension;
  onPress?: (dimension: UomDimension) => void;
}

// Compact, tappable dimension row (name + code pill + description). Edit/delete live on the detail screen
// (matching the web: the list is plain rows; the detail panel owns the actions).
export function UomDimensionCard({
  dimension,
  onPress,
}: UomDimensionCardProps) {
  return (
    <CardPressable className="gap-2 p-4" onPress={() => onPress?.(dimension)}>
      <View className="flex-row items-center gap-2">
        <Text
          className="min-w-0 flex-1 text-base font-bold text-foreground"
          numberOfLines={1}
        >
          {dimension.name}
        </Text>
        <Badge variant="secondary">
          <Text className="text-[10px] font-semibold uppercase text-secondary-foreground">
            {dimension.code}
          </Text>
        </Badge>
      </View>
      <View className="gap-1">
        <Text className="text-xs text-foreground" numberOfLines={1}>
          {dimension.description || "—"}
        </Text>
      </View>
    </CardPressable>
  );
}
