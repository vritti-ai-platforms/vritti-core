import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { useStorageLocationConfigsTable } from '@/hooks/inventory-items';
import type { InventoryItemData } from '@/schemas/inventory-items';

interface OverviewTabProps {
  item: InventoryItemData;
}

export const OverviewTab = ({ item }: OverviewTabProps) => {
  const { data: response } = useStorageLocationConfigsTable(item.id);
  const configs = response?.result ?? [];

  const totalStocked = configs.reduce((sum, row) => sum + row.stockedQuantity, 0);
  const totalReserved = configs.reduce((sum, row) => sum + row.reservedQuantity, 0);
  const totalAvailable = configs.reduce((sum, row) => sum + row.availableQuantity, 0);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge variant="outline" className="mt-1">
                {item.type === 'MATERIAL' ? 'Material' : 'Product'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="mt-1 font-medium">{item.categoryName ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unit of Measure</p>
              <p className="mt-1 font-medium">{item.uomSymbol ?? '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className={`mt-1 ${item.description ? '' : 'text-muted-foreground'}`}>
                {item.description ?? 'No description'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Stocked</p>
              <p className="mt-1 font-mono text-lg font-semibold">
                {totalStocked} <span className="text-sm font-normal text-muted-foreground">{item.uomSymbol}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reserved</p>
              <p className="mt-1 font-mono text-lg font-semibold">
                {totalReserved} <span className="text-sm font-normal text-muted-foreground">{item.uomSymbol}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Available</p>
              <p className="mt-1 font-mono text-lg font-semibold text-success">
                {totalAvailable} <span className="text-sm font-normal">{item.uomSymbol}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
