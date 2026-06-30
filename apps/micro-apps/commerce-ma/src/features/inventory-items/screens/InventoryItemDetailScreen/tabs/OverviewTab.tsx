import { Card } from '@vritti/quantum-ui-native/Card';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
import { View } from 'react-native';
import { trackingLabel, typeLabel } from '../../../../../services/inventory-items';
import type { InventoryItem } from '../../../../../types/inventory-items';

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View className="gap-1">
      <Text className="text-xs uppercase text-muted-foreground">{label}</Text>
      <Text className="text-base font-semibold text-foreground">{value ?? '—'}</Text>
    </View>
  );
}

// Overview tab — the item's core fields. Edit/Delete now live in the header's overflow menu
// (ItemActionsMenu via the tabs ScreenHeader rightActions slot), so this tab is read-only details.
export function OverviewTab({ item }: { item: InventoryItem }) {
  return (
    <ScreenContainer scrollable contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Card className="gap-3 p-4">
        <DetailRow label="Code" value={item.code} />
        <DetailRow label="Type" value={typeLabel(item.type)} />
        <DetailRow label="Tracking" value={trackingLabel(item.tracking)} />
        <DetailRow label="Pick strategy" value={item.pickStrategy} />
        <DetailRow label="Category" value={item.categoryName} />
        <DetailRow label="Unit of measure" value={item.uomSymbol} />
        <DetailRow label="HSN code" value={item.hsnCode} />
        <DetailRow label="Description" value={item.description} />
      </Card>
    </ScreenContainer>
  );
}
