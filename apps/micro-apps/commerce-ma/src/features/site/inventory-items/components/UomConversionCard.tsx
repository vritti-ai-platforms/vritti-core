import { Button } from "@vritti/quantum-ui-native/Button";
import { Card } from "@vritti/quantum-ui-native/Card";
import { DynamicIcon } from "@vritti/quantum-ui-native/DynamicIcon";
import { Text } from "@vritti/quantum-ui-native/Text";
import { View } from "react-native";
import type { UomConversion } from "../../../../types/uom-conversions";

const EDIT_ICON = { sfSymbol: "pencil", materialSymbol: "edit" } as const;
const TRASH_ICON = { sfSymbol: "trash", materialSymbol: "delete" } as const;

interface UomConversionCardProps {
  conversion: UomConversion;
  // The item's primary UOM symbol — the right side of the "1 alt = N primary" conversion line.
  primaryUomSymbol: string | null;
  onEdit?: (conversion: UomConversion) => void;
  onDelete?: (conversion: UomConversion) => void;
}

// Two-section card: a header with the alternate unit (UOM) + edit/delete actions, a divider, then a
// footer showing the conversion ratio. Actions are explicit icon buttons (no whole-card press).
export function UomConversionCard({
  conversion,
  primaryUomSymbol,
  onEdit,
  onDelete,
}: UomConversionCardProps) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <View className="flex-row items-center justify-between gap-3 px-4 pb-3 pt-4">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            UOM
          </Text>
          <Text className="text-md font-bold text-foreground" numberOfLines={1}>
            {conversion.uomName} ({conversion.uomSymbol})
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {onEdit && conversion.canEdit ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-sm border border-border"
              onPress={() => onEdit(conversion)}
              accessibilityLabel="Edit conversion"
              hitSlop={8}
            >
              <DynamicIcon
                icon={EDIT_ICON}
                size={14}
                className="text-foreground"
              />
            </Button>
          ) : null}
          {onDelete && conversion.canDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-sm border border-destructive"
              onPress={() => onDelete(conversion)}
              accessibilityLabel="Delete conversion"
              hitSlop={8}
            >
              <DynamicIcon
                icon={TRASH_ICON}
                size={14}
                className="text-destructive"
              />
            </Button>
          ) : null}
        </View>
      </View>

      <View className="mx-4 h-px bg-border" />

      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Text className="text-xs uppercase tracking-wider text-muted-foreground">
          Conversion
        </Text>
        <Text
          className="flex-1 text-right font-mono text-base text-foreground"
          numberOfLines={1}
        >
          1 {conversion.uomSymbol} = {conversion.toPrimaryConversionFactor}{" "}
          {primaryUomSymbol ?? "—"}
        </Text>
      </View>
    </Card>
  );
}
