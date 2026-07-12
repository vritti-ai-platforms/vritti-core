import { Badge } from "@vritti/quantum-ui-native/Badge";
import { Card } from "@vritti/quantum-ui-native/Card";
import { DynamicIcon } from "@vritti/quantum-ui-native/DynamicIcon";
import { useFormatters } from "@vritti/quantum-ui-native/hooks";
import { Text } from "@vritti/quantum-ui-native/Text";
import { useUnstableNativeVariable } from "nativewind";
import { View } from "react-native";
import type { Supplier } from "../../../../types/suppliers";

const STAR_ICON = {
  sfSymbol: "star.fill",
  materialSymbol: "star",
} as const;

// One label + value cell of the footer grid. Value is monospace; label is muted/uppercase.
function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 flex-row items-center justify-between gap-2">
      <Text
        className="text-xs uppercase tracking-wide text-muted-foreground"
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text className="font-mono text-sm text-foreground" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// Read-only supplier link card: header (name + code, preferred/active pills), divider, then a 2-col grid
// of the per-supplier item terms (item code, UOM, unit price, min order, lead time).
export function SupplierCard({ supplier }: { supplier: Supplier }) {
  const fmt = useFormatters();
  // Resolve the themed success token and composite a translucent fill for the "Preferred" pill — same
  // reason as StockLevelCard: NativeWind's `bg-X/NN` opacity doesn't composite `hsl(var(--X))` tokens
  // reliably (renders ~black), and reading the var respects the app theme over the system appearance.
  const useVar = useUnstableNativeVariable as unknown as (
    name: string,
  ) => string | undefined;
  const successHsl = useVar("--success");
  const preferredBg = successHsl ? `hsla(${successHsl} / 0.15)` : undefined;

  const unitPrice = supplier.unitPrice
    ? fmt.currency(supplier.unitPrice).primary
    : "—";
  const minOrder =
    supplier.minOrderQuantity != null ? String(supplier.minOrderQuantity) : "—";
  const leadTime =
    supplier.leadTimeDays != null ? `${supplier.leadTimeDays} d` : "—";

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <View className="flex-row items-start justify-between gap-3 px-4 pb-3 pt-4">
        <View className="min-w-0 flex-1 gap-0.5">
          <Text
            className="text-base font-bold text-foreground"
            numberOfLines={1}
          >
            {supplier.supplierName ?? "Supplier"}
          </Text>
          {supplier.supplierCode ? (
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {supplier.supplierCode}
            </Text>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2">
          {supplier.isPreferred ? (
            <Badge
              variant="secondary"
              style={preferredBg ? { backgroundColor: preferredBg } : undefined}
            >
              <DynamicIcon
                icon={STAR_ICON}
                size={11}
                className="text-success"
                style={{ width: 11, height: 11 }}
              />
              <Text className="text-xs font-semibold text-success">
                Preferred
              </Text>
            </Badge>
          ) : null}
          <Badge variant={supplier.isActive ? "secondary" : "outline"}>
            <Text
              className={`text-xs font-semibold ${supplier.isActive ? "text-secondary-foreground" : "text-muted-foreground"}`}
            >
              {supplier.isActive ? "Active" : "Inactive"}
            </Text>
          </Badge>
        </View>
      </View>

      <View className="mx-4 h-px bg-border" />

      <View className="gap-2 px-4 pb-4 pt-3">
        <View className="flex-row gap-4">
          <StatCell label="Item Code" value={supplier.supplierItemCode ?? "—"} />
          <StatCell label="UOM" value={supplier.uomSymbol} />
        </View>
        <View className="flex-row gap-4">
          <StatCell label="Unit Price" value={unitPrice} />
          <StatCell label="Min Order" value={minOrder} />
        </View>
        <View className="flex-row gap-4">
          <StatCell label="Lead Time" value={leadTime} />
          <View className="flex-1" />
        </View>
      </View>
    </Card>
  );
}
