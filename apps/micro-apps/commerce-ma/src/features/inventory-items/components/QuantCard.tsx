import { Button } from "@vritti/quantum-ui-native/Button";
import { Card } from "@vritti/quantum-ui-native/Card";
import { DynamicIcon } from "@vritti/quantum-ui-native/DynamicIcon";
import { useFormatters } from "@vritti/quantum-ui-native/hooks";
import { Text } from "@vritti/quantum-ui-native/Text";
import { View } from "react-native";
import type { Quant } from "../../../types/quants";

const PIN_ICON = { sfSymbol: "mappin", materialSymbol: "location_on" } as const;
const EYE_ICON = { sfSymbol: "eye", materialSymbol: "visibility" } as const;

// One label + value cell of the footer grid. Value is monospace; the UOM symbol (when present) is muted.
function StatCell({
  label,
  value,
  uom,
}: {
  label: string;
  value: string;
  uom?: string | null;
}) {
  return (
    <View className="flex-1 flex-row items-center justify-between gap-2">
      <Text className="text-xs text-muted-foreground" numberOfLines={1}>
        {label}
      </Text>
      <Text className="font-mono text-sm text-foreground" numberOfLines={1}>
        {value}
        {uom ? <Text className="text-muted-foreground"> {uom}</Text> : null}
      </Text>
    </View>
  );
}

interface QuantCardProps {
  quant: Quant;
  // The item's primary UOM symbol — appended to qty / available values.
  uomSymbol: string | null;
  onView?: (quant: Quant) => void;
}

// Two-section card: header (location + path + view button), divider, then a grid of the quant's figures.
export function QuantCard({ quant, uomSymbol, onView }: QuantCardProps) {
  const fmt = useFormatters();

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <View className="flex-row items-center justify-between gap-3 px-4 pb-3 pt-4">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-base font-bold text-foreground" numberOfLines={1}>
            {quant.locationName ?? "Location"}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <DynamicIcon
              icon={PIN_ICON}
              size={14}
              className="text-muted-foreground"
              style={{ width: 14, height: 14 }}
            />
            <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
              {quant.locationPath ?? quant.locationName ?? "—"}
            </Text>
          </View>
        </View>
        {onView ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-sm border border-border"
            onPress={() => onView(quant)}
            accessibilityLabel="View quant details"
            hitSlop={8}
          >
            <DynamicIcon icon={EYE_ICON} size={16} className="text-foreground" />
          </Button>
        ) : null}
      </View>

      <View className="mx-4 h-px bg-border" />

      <View className="gap-2 px-4 pb-4 pt-3">
        <View className="flex-row gap-4">
          <StatCell label="Lot #" value={quant.lotNumber ?? "—"} />
          <StatCell label="Qty" value={String(quant.quantity)} uom={uomSymbol} />
        </View>
        <View className="flex-row gap-4">
          <StatCell label="Reserved" value={String(quant.reservedQuantity)} />
          <StatCell
            label="Available"
            value={String(quant.availableQuantity)}
            uom={uomSymbol}
          />
        </View>
        <View className="flex-row gap-4">
          <StatCell label="Expiry Date" value={fmt.date(quant.expiryDate).primary} />
          <View className="flex-1" />
        </View>
      </View>
    </Card>
  );
}
