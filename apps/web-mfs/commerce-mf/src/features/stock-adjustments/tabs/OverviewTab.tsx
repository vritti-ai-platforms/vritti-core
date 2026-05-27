import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type React from 'react';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';

interface OverviewTabProps {
  adjustment: StockAdjustmentData;
  typeLabel: string;
  typeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ adjustment, typeLabel, typeVariant }) => (
  <Card>
    <CardHeader>
      <CardTitle>Details</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-6">
        <DetailField label="Inventory Item" type="string" value={adjustment.inventoryItemName} />
        <DetailField label="Unit of Measure" type="string" value={adjustment.inventoryItemUomSymbol} />
        <DetailField label="Type" type="string" value={<Badge variant={typeVariant}>{typeLabel}</Badge>} />
        <DetailField
          label="Tracking"
          type="string"
          value={<Badge variant="outline">{adjustment.inventoryItemTracking}</Badge>}
        />
        <DetailField label="Reason" type="string" value={adjustment.reason} />
        <DetailField
          label="Total Quantity"
          type="string"
          value={`${adjustment.totalQuantity} ${adjustment.inventoryItemUomSymbol}`}
          mono
        />
        <DetailField label="Created" type="dateTime" value={adjustment.createdAt} />
        <DetailField label="Published At" type="dateTime" value={adjustment.publishedAt} />
      </div>
    </CardContent>
  </Card>
);
