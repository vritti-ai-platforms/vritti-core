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
        <DetailField
          label="Inventory Item"
          value={`${adjustment.inventoryItemName} (${adjustment.inventoryItemUomSymbol})`}
        />
        <DetailField label="Type" value={<Badge variant={typeVariant}>{typeLabel}</Badge>} />
        <DetailField label="Reason" value={adjustment.reason} />
        <DetailField
          label="Total Quantity"
          value={`${adjustment.totalQuantity} ${adjustment.inventoryItemUomSymbol}`}
          number
        />
        <DetailField label="Tracking" value={<Badge variant="outline">{adjustment.inventoryItemTracking}</Badge>} />
        <DetailField label="Created" value={adjustment.createdAt} />
        <DetailField label="Created By" value={adjustment.createdByFullName} />
        <DetailField label="Published At" value={adjustment.publishedAt} />
      </div>
    </CardContent>
  </Card>
);
