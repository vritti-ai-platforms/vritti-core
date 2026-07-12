import { Badge } from "@vritti/quantum-ui-native/Badge";
import { Card } from "@vritti/quantum-ui-native/Card";
import { DynamicIcon } from "@vritti/quantum-ui-native/DynamicIcon";
import { useFormatters } from "@vritti/quantum-ui-native/hooks";
import { Text } from "@vritti/quantum-ui-native/Text";
import type { ReactNode } from "react";
import { View } from "react-native";
import type { LedgerEntry } from "../../../../types/ledger";

const CALENDAR_ICON = { sfSymbol: "calendar", materialSymbol: "event" } as const;

// Friendly labels for the movement types (mirrors the inventory_item_ledger_type enum).
const TYPE_LABELS: Record<string, string> = {
  GOODS_RECEIPT: "Goods Receipt",
  ORDER_RESERVE: "Order Reserve",
  ORDER_DEDUCT: "Order Deduct",
  ORDER_CANCEL: "Order Cancel",
  ADJUSTMENT: "Adjustment",
  CONVERSION_INPUT: "Conversion In",
  CONVERSION_OUTPUT: "Conversion Out",
  TRANSFER_OUT: "Transfer Out",
  TRANSFER_IN: "Transfer In",
  OPENING_STOCK: "Opening Stock",
};

// Short, clipped reference id — uuids are too long to show in full (e.g. "90f2493d…").
function clipReferenceId(id: string, head = 8): string {
  return id.length > head ? `${id.slice(0, head)}…` : id;
}

// One label / value row of the footer (value right-aligned, may span two lines).
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <View className="min-w-0 flex-1 items-end">{children}</View>
    </View>
  );
}

interface LedgerCardProps {
  entry: LedgerEntry;
  // The item's primary UOM symbol — appended to signed qty / balance values.
  uomSymbol: string | null;
}

// Two-section card: header (type badge + signed quantity + timestamp), divider, then balance / reference /
// notes. Inflow quantities are green, outflows red. Balance is "—" — the feed carries no running balance.
export function LedgerCard({ entry, uomSymbol }: LedgerCardProps) {
  const fmt = useFormatters();
  const uom = uomSymbol ?? "";
  const qty = entry.quantity;
  const qtyColor =
    qty > 0 ? "text-success" : qty < 0 ? "text-destructive" : "text-foreground";
  const qtyStr = `${qty > 0 ? "+" : ""}${fmt.number(qty).primary}`;
  const balanceStr =
    entry.balanceAfter != null ? fmt.number(entry.balanceAfter).primary : "—";

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <View className="gap-2 px-4 pb-3 pt-4">
        <View className="flex-row items-center justify-between gap-3">
          <Badge variant="default">
            <Text className="text-xs font-semibold text-primary-foreground">
              {TYPE_LABELS[entry.type] ?? entry.type}
            </Text>
          </Badge>
          <Text
            className={`font-mono text-base font-semibold ${qtyColor}`}
            numberOfLines={1}
          >
            {qtyStr}
            {uom ? <Text className="text-muted-foreground"> {uom}</Text> : null}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <DynamicIcon
            icon={CALENDAR_ICON}
            size={14}
            className="text-muted-foreground"
            style={{ width: 14, height: 14 }}
          />
          <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
            {fmt.dateTime(entry.createdAt).primary}
          </Text>
        </View>
      </View>

      <View className="mx-4 h-px bg-border" />

      <View className="gap-2 px-4 pb-4 pt-3">
        <InfoRow label="Balance">
          <Text className="font-mono text-sm text-foreground" numberOfLines={1}>
            {balanceStr}
            {uom ? <Text className="text-muted-foreground"> {uom}</Text> : null}
          </Text>
        </InfoRow>
        <InfoRow label="Reference">
          <Text className="text-right text-sm text-foreground" numberOfLines={1}>
            {entry.referenceType ?? "—"}
          </Text>
          {entry.referenceId ? (
            <Text
              className="font-mono text-xs text-muted-foreground"
              numberOfLines={1}
            >
              {clipReferenceId(entry.referenceId)}
            </Text>
          ) : null}
        </InfoRow>
        <InfoRow label="Notes">
          <Text className="text-right text-sm text-foreground" numberOfLines={2}>
            {entry.notes ?? "—"}
          </Text>
        </InfoRow>
      </View>
    </Card>
  );
}
