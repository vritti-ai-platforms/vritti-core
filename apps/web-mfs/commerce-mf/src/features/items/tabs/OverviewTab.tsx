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
          <DetailField label="Name" type="string" value={item.name} className="col-span-2" />
          <DetailField label="Code" type="string" mono value={item.code} />
          <DetailField label="Type" type="string" value={item.type === 'PRODUCT' ? 'Product' : 'Service'} />
          <DetailField
            label="Availability"
            type="string"
            value={
              <Badge
                variant="outline"
                className={item.isAvailable ? 'border-transparent bg-success/15 text-success' : ''}
              >
                {item.isAvailable ? 'Available' : 'Unavailable'}
              </Badge>
            }
          />
          <DetailField label="Category" type="string" value={item.categoryName} />
          <DetailField label="Tax group" type="string" value={taxGroup?.name} />
          <DetailField
            label="Variants"
            type="string"
            value={item.variants.length > 0 ? String(item.variants.length) : null}
          />
          <DetailField label="Price" type="string" value={getPriceSummary(item)} />
          <DetailField label="Description" type="string" value={item.description} className="col-span-2" />
        </div>
      </CardContent>
    </Card>
  );
};
