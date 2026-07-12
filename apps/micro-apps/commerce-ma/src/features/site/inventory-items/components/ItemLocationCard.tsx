import { Button } from "@vritti/quantum-ui-native/Button";
import { Card } from "@vritti/quantum-ui-native/Card";
import { DynamicIcon } from "@vritti/quantum-ui-native/DynamicIcon";
import { Text } from "@vritti/quantum-ui-native/Text";
import { View } from "react-native";
import type { ItemLocation } from "../../../../types/item-locations";

const PIN_ICON = { sfSymbol: "mappin", materialSymbol: "location_on" } as const;
const EDIT_ICON = { sfSymbol: "pencil", materialSymbol: "edit" } as const;
const TRASH_ICON = { sfSymbol: "trash", materialSymbol: "delete" } as const;

interface ItemLocationCardProps {
  location: ItemLocation;
  // The item's primary UOM symbol — appended to the Min. Stock Level value.
  uomSymbol: string | null;
  onEdit?: (location: ItemLocation) => void;
  onDelete?: (location: ItemLocation) => void;
}

// Two-section card: header (location name + pin/path + edit/delete), divider, then the reorder threshold.
export function ItemLocationCard({ location, uomSymbol, onEdit, onDelete }: ItemLocationCardProps) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <View className="flex-row items-center justify-between gap-3 px-4 pb-3 pt-4">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-base font-bold text-foreground" numberOfLines={1}>
            {location.locationName ?? "Location"}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <DynamicIcon
              icon={PIN_ICON}
              size={14}
              className="text-muted-foreground"
              style={{ width: 14, height: 14 }}
            />
            <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
              {location.locationPath ?? location.locationName ?? "—"}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {onEdit ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-sm border border-border"
              onPress={() => onEdit(location)}
              accessibilityLabel="Edit location"
              hitSlop={8}
            >
              <DynamicIcon icon={EDIT_ICON} size={14} className="text-foreground" />
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-sm border border-destructive"
              onPress={() => onDelete(location)}
              accessibilityLabel="Delete location"
              hitSlop={8}
            >
              <DynamicIcon icon={TRASH_ICON} size={14} className="text-destructive" />
            </Button>
          ) : null}
        </View>
      </View>

      <View className="mx-4 h-px bg-border" />

      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Text className="text-sm text-muted-foreground">Min. Stock Level</Text>
        <Text className="flex-1 text-right font-mono text-base text-foreground" numberOfLines={1}>
          {location.reorderLevel}
          {uomSymbol ? ` ${uomSymbol}` : ""}
        </Text>
      </View>
    </Card>
  );
}
