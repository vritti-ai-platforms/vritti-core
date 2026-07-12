import { Badge } from '@vritti/quantum-ui-native/Badge';
import { CardPressable } from '@vritti/quantum-ui-native/CardPressable';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { useFormatters } from '@vritti/quantum-ui-native/hooks';
import { Text } from '@vritti/quantum-ui-native/Text';
import { useUnstableNativeVariable } from 'nativewind';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { GoodsReceipt, GoodsReceiptStatus } from '../../../../types/goods-receipts';

const PACKAGE_ICON = { sfSymbol: 'shippingbox.fill', materialSymbol: 'inventory_2' } as const;
const CALENDAR_ICON = { sfSymbol: 'calendar', materialSymbol: 'event' } as const;

// tsc resolves nativewind's web type for this hook (() => never); at RN runtime it's the native
// (name) => string variant (mirrors TaxGroupCard) — the MF-shared, app-theme-accurate source.
const useThemeVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

// Draft = muted (gray), Published = success (green). The Badge variants' faded fills don't render on these
// hsl(var()) tokens, so tint from the resolved theme var: a faded fill + a solid dot/text.
const STATUS_META: Record<GoodsReceiptStatus, { label: string; token: string }> = {
  DRAFT: { label: 'Draft', token: '--muted-foreground' },
  PUBLISHED: { label: 'Published', token: '--success' },
};

// One label / value row of the footer (value right-aligned).
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Text>
      <View className="min-w-0 flex-1 items-end">{children}</View>
    </View>
  );
}

interface GoodsReceiptCardProps {
  gr: GoodsReceipt;
  onPress?: (gr: GoodsReceipt) => void;
}

// GR card: a package tile + mono GR number + received date, a Draft/Published status pill, then supplier
// and purchase-order rows (PO shows "—" when unlinked). Tap navigates to the detail.
export function GoodsReceiptCard({ gr, onPress }: GoodsReceiptCardProps) {
  const fmt = useFormatters();
  const meta = STATUS_META[gr.status] ?? STATUS_META.DRAFT;

  const statusVar = useThemeVar(meta.token);
  const statusHsl = statusVar ? statusVar.split(' ').join(', ') : undefined;
  const statusColor = statusHsl ? `hsl(${statusHsl})` : undefined;
  const statusBg = statusHsl ? `hsla(${statusHsl}, 0.18)` : undefined;

  return (
    <CardPressable className="gap-0 overflow-hidden p-0" onPress={() => onPress?.(gr)}>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-4">
        <View className="h-14 w-14 items-center justify-center rounded-xl bg-secondary">
          <DynamicIcon icon={PACKAGE_ICON} size={22} className="text-primary" />
        </View>
        <View className="min-w-0 flex-1 gap-1.5">
          <Text className="font-mono text-base font-bold text-foreground" numberOfLines={1}>
            {gr.grNumber}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <DynamicIcon
              icon={CALENDAR_ICON}
              size={14}
              className="text-muted-foreground"
              style={{ width: 14, height: 14 }}
            />
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {fmt.date(gr.receivedDate).primary}
            </Text>
          </View>
        </View>
        <Badge variant="secondary" style={statusBg ? { backgroundColor: statusBg } : undefined}>
          <View className="flex-row items-center gap-1.5">
            <View
              className="h-1.5 w-1.5 rounded-full"
              style={statusColor ? { backgroundColor: statusColor } : undefined}
            />
            <Text className="text-xs font-medium" style={statusColor ? { color: statusColor } : undefined}>
              {meta.label}
            </Text>
          </View>
        </Badge>
      </View>

      <View className="mx-4 h-px bg-border" />

      <View className="gap-2 px-4 pb-4 pt-3">
        <InfoRow label="Supplier">
          <Text className="text-right text-sm font-medium text-foreground" numberOfLines={1}>
            {gr.supplierName || '—'}
          </Text>
        </InfoRow>
        <InfoRow label="Purchase Order">
          <Text className="text-right font-mono text-sm text-foreground" numberOfLines={1}>
            {gr.po?.poNumber ?? '—'}
          </Text>
        </InfoRow>
      </View>
    </CardPressable>
  );
}
