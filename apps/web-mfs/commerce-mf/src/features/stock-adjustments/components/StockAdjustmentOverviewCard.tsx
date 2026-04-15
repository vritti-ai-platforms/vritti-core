import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';

interface StockAdjustmentOverviewCardProps {
  adjustment: StockAdjustmentData;
  typeLabel: string;
  typeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
}

export const StockAdjustmentOverviewCard = ({ adjustment, typeLabel, typeVariant }: StockAdjustmentOverviewCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-6">
          <div>
            <dt className="text-sm text-muted-foreground">Inventory Item</dt>
            <dd className="mt-1 font-medium">
              {adjustment.inventoryItemName} ({adjustment.inventoryItemUomSymbol})
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Type</dt>
            <dd className="mt-1">
              <Badge variant={typeVariant}>{typeLabel}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Reason</dt>
            <dd className="mt-1">{adjustment.reason ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Created</dt>
            <dd className="mt-1">{new Date(adjustment.createdAt).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Created By</dt>
            <dd className="mt-1">{adjustment.createdByFullName}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Published</dt>
            <dd className="mt-1">
              {adjustment.publishedAt ? new Date(adjustment.publishedAt).toLocaleDateString() : '—'}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};
