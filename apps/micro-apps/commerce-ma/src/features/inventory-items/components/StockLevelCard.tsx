import { Badge } from "@vritti/quantum-ui-native/Badge";
import { Card } from "@vritti/quantum-ui-native/Card";
import { DynamicIcon } from "@vritti/quantum-ui-native/DynamicIcon";
import { Text } from "@vritti/quantum-ui-native/Text";
import { useUnstableNativeVariable } from "nativewind";
import { View } from "react-native";
import { stockStatus } from "../../../services/stock-levels";
import type { StockLevel } from "../../../types/stock-levels";

const PIN_ICON = {
  sfSymbol: "mappin",
  materialSymbol: "location_on",
} as const;

// Translucent status pills. The fill is computed from the resolved theme CSS var (see the component) rather
// than a `bg-X/15` class — NativeWind's opacity modifier doesn't composite these `hsl(var(--X))` tokens
// reliably here (renders ~black), and reading the var also respects the app theme, not the system appearance.
const STATUS_META = {
  out: { label: "No Stock", cssVar: "--destructive", textClass: "text-destructive" },
  low: { label: "Low Stock", cssVar: "--warning", textClass: "text-warning" },
  in: { label: "In Stock", cssVar: "--success", textClass: "text-success" },
} as const;

// One label + value cell of the footer grid. Value is monospace; the UOM symbol (when present) is muted.
function StatCell({
  label,
  value,
  uom,
}: {
  label: string;
  value: number | null;
  uom?: string | null;
}) {
  return (
    <View className="flex-1 flex-row items-center justify-between gap-2">
      <Text
        className="text-xs uppercase tracking-wide text-muted-foreground"
        numberOfLines={1}
      >
        {label}
      </Text>
      {value == null ? (
        <Text className="font-mono text-sm text-muted-foreground">—</Text>
      ) : (
        <Text className="font-mono text-sm text-foreground" numberOfLines={1}>
          {value}
          {uom ? <Text className="text-muted-foreground"> {uom}</Text> : null}
        </Text>
      )}
    </View>
  );
}

interface StockLevelCardProps {
  stock: StockLevel;
  // The item's primary UOM symbol — appended to stocked / available / min-level values.
  uomSymbol: string | null;
}

// Two-section card: header (location + status pill), divider, then a 2×2 grid of stock figures.
export function StockLevelCard({ stock, uomSymbol }: StockLevelCardProps) {
  const status = STATUS_META[stockStatus(stock)];
  // Resolve the themed token (bare HSL triplet, e.g. "0 84% 60%") and composite a translucent pill fill.
  // useUnstableNativeVariable is typed argless upstream, so cast to a (name) => value hook (as DynamicIcon does).
  const useVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;
  const statusHsl = useVar(status.cssVar);
  // Must be the `hsla(...)` keyword for the slash-alpha form — RN's normalizeColor only accepts the `/ A`
  // notation under `hsla`/`rgba`; `hsl(H S L / A)` parses to null (no background).
  const statusBg = statusHsl ? `hsla(${statusHsl} / 0.18)` : undefined;

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <View className="flex-row items-start justify-between gap-3 px-4 pb-3 pt-4">
        <View className="min-w-0 flex-1 gap-1">
          <Text
            className="text-base font-bold text-foreground"
            numberOfLines={1}
          >
            {stock.locationName ?? "Location"}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <DynamicIcon
              icon={PIN_ICON}
              size={14}
              className="text-muted-foreground"
              // Explicit square frame so the tall pin glyph centers predictably with the text (items-center)
              // instead of sitting high in an intrinsic, top-heavy frame.
              style={{ width: 14, height: 14 }}
            />
            <Text
              className="flex-1 text-xs text-muted-foreground"
              numberOfLines={1}
            >
              {stock.locationPath ?? stock.locationName ?? "—"}
            </Text>
          </View>
        </View>
        <Badge variant="secondary" style={statusBg ? { backgroundColor: statusBg } : undefined}>
          <Text className={`text-xs font-semibold ${status.textClass}`}>
            {status.label}
          </Text>
        </Badge>
      </View>

      <View className="mx-4 h-px bg-border" />

      <View className="gap-2 px-4 pb-4 pt-3">
        <View className="flex-row gap-4">
          <StatCell
            label="Stocked"
            value={stock.stockedQuantity}
            uom={uomSymbol}
          />
          <StatCell label="Reserved" value={stock.reservedQuantity} />
        </View>
        <View className="flex-row gap-4">
          <StatCell
            label="Available"
            value={stock.availableQuantity}
            uom={uomSymbol}
          />
          <StatCell
            label="Min. Level"
            value={stock.reorderLevel}
            uom={uomSymbol}
          />
        </View>
      </View>
    </Card>
  );
}
