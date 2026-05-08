import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type React from 'react';
import { useTaxGroups } from '@/hooks/tax-groups';
import type { ItemDetail } from '@/schemas/items';
import { getPriceSummary } from '@/utils/items';

interface OverviewTabProps {
  item: ItemDetail;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ item }) => {
  const { data: taxGroups = [] } = useTaxGroups(item.businessUnitId);
  const taxGroup = taxGroups.find((t) => t.id === item.taxGroupId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <DetailField label="Name" value={item.name} className="col-span-2" />
          <DetailField label="Code" value={<span className="font-mono">{item.code}</span>} />
          <DetailField label="Type" value={item.type === 'PRODUCT' ? 'Product' : 'Service'} />
          <DetailField
            label="Availability"
            value={
              <Badge
                variant="outline"
                className={item.isAvailable ? 'border-transparent bg-success/15 text-success' : ''}
              >
                {item.isAvailable ? 'Available' : 'Unavailable'}
              </Badge>
            }
          />
          <DetailField label="Category" value={item.categoryName} />
          <DetailField label="Tax group" value={taxGroup?.name} />
          <DetailField label="Variants" value={item.variants.length > 0 ? String(item.variants.length) : null} />
          <DetailField label="Price" value={getPriceSummary(item)} />
          <DetailField label="Description" value={item.description} className="col-span-2" />
        </div>
      </CardContent>
    </Card>
  );
};
