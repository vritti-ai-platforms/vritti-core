import { Badge } from '@vritti/quantum-ui-native/Badge';
import { Card } from '@vritti/quantum-ui-native/Card';
import { useFormatters } from '@vritti/quantum-ui-native/hooks';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
import { useUnstableNativeVariable } from 'nativewind';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { GoodsReceipt, GoodsReceiptStatus } from '../../../../../../types/goods-receipts';

const useThemeVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

const STATUS_META: Record<GoodsReceiptStatus, { label: string; token: string }> = {
  DRAFT: { label: 'Draft', token: '--muted-foreground' },
  PUBLISHED: { label: 'Published', token: '--success' },
};

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Text>
      <View className="min-w-0 flex-1 items-end">{children}</View>
    </View>
  );
}

// Overview tab: the GR header (number + status), supplier + received/created + notes, and the linked
// purchase order (or "no PO"). Read-only; dates/currency via useFormatters (never hand-rolled).
export function OverviewTab({ gr }: { gr: GoodsReceipt }) {
  const fmt = useFormatters();
  const meta = STATUS_META[gr.status] ?? STATUS_META.DRAFT;
  const statusVar = useThemeVar(meta.token);
  const statusHsl = statusVar ? statusVar.split(' ').join(', ') : undefined;
  const statusColor = statusHsl ? `hsl(${statusHsl})` : undefined;
  const statusBg = statusHsl ? `hsla(${statusHsl}, 0.18)` : undefined;

  return (
    <ScreenContainer scrollable contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card className="gap-3 p-4">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="font-mono text-lg font-bold text-foreground" numberOfLines={1}>
            {gr.grNumber}
          </Text>
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
        <InfoRow label="Supplier">
          <Text className="text-right text-sm font-medium text-foreground">{gr.supplierName || '—'}</Text>
        </InfoRow>
        <InfoRow label="Received">
          <Text className="text-right text-sm text-foreground">{fmt.date(gr.receivedDate).primary}</Text>
        </InfoRow>
        <InfoRow label="Created">
          <Text className="text-right text-sm text-foreground">{fmt.dateTime(gr.createdAt).primary}</Text>
        </InfoRow>
        <InfoRow label="Notes">
          <Text className="text-right text-sm text-foreground" numberOfLines={3}>
            {gr.notes ?? '—'}
          </Text>
        </InfoRow>
      </Card>

      <Card className="gap-3 p-4">
        <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purchase Order</Text>
        {gr.po ? (
          <>
            <InfoRow label="PO Number">
              <Text className="text-right font-mono text-sm text-foreground">{gr.po.poNumber}</Text>
            </InfoRow>
            <InfoRow label="Order Date">
              <Text className="text-right text-sm text-foreground">{fmt.date(gr.po.orderDate).primary}</Text>
            </InfoRow>
            <InfoRow label="Expected">
              <Text className="text-right text-sm text-foreground">
                {gr.po.expectedBy ? fmt.date(gr.po.expectedBy).primary : '—'}
              </Text>
            </InfoRow>
            <InfoRow label="Total">
              <Text className="text-right font-mono text-sm text-foreground">
                {fmt.currency(gr.po.totalAmount).primary}
              </Text>
            </InfoRow>
          </>
        ) : (
          <Text className="text-sm text-muted-foreground">No purchase order linked.</Text>
        )}
      </Card>
    </ScreenContainer>
  );
}
