import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type React from 'react';
import { type PurchaseItemView, purchaseItemSourceConfig } from '@/schemas/purchases';

interface PurchaseItemInfoCardProps {
  item: PurchaseItemView;
}

// What the item is and why the purchase needs it: its code, category, tax class and unit, where the need came from,
// when it is needed by and the buyer's notes
export const PurchaseItemInfoCard: React.FC<PurchaseItemInfoCardProps> = ({ item }) => (
  <Card>
    <CardHeader>
      <CardTitle>Item</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-4">
      <DetailField label="Code" type="string" value={item.inventoryItemCode} mono />
      <DetailField label="Category" type="string" value={item.categoryName} />
      <DetailField label="Tax Class" type="string" value={item.taxClassName} />
      <DetailField
        label="Primary Unit"
        type="string"
        value={`${item.primaryUomSymbol}${item.primaryUomAllowDecimal ? '' : ' · whole units'}`}
      />
      <DetailField label="Source" type="string" value={purchaseItemSourceConfig[item.source].label} />
      <DetailField label="Needed By" type="date" value={item.neededBy} />
      <DetailField label="Notes" type="string" value={item.notes} className="col-span-full" />
    </CardContent>
  </Card>
);
