import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import type React from 'react';
import { useTaxGroup } from '@/hooks/legal-entity/tax-groups';
import { FULFILMENT_TYPE_OPTIONS, type OfferingDetail } from '@/schemas/offerings';
import { getPriceRange } from '@/utils/offerings';

interface OverviewTabProps {
  offering: OfferingDetail;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ offering }) => {
  const fmt = useFormatters();
  const { data: taxGroup } = useTaxGroup(offering.salesTaxGroupId ?? null);
  const fulfilmentLabel =
    FULFILMENT_TYPE_OPTIONS.find((o) => o.value === offering.fulfilmentType)?.label ?? offering.fulfilmentType;

  const priceRange = getPriceRange(offering);
  const isRange = priceRange != null && priceRange.min.value !== priceRange.max.value;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <DetailField label="Name" type="string" value={offering.name} className="col-span-2" />
          <DetailField label="Type" type="string" value={fulfilmentLabel} />
          <DetailField
            label="Availability"
            type="string"
            value={
              <Badge
                variant="outline"
                className={offering.isAvailable ? 'border-transparent bg-success/15 text-success' : ''}
              >
                {offering.isAvailable ? 'Available' : 'Unavailable'}
              </Badge>
            }
          />
          <DetailField label="Category" type="string" value={offering.categoryName} />
          <DetailField label="Sales tax group" type="string" value={taxGroup?.name} />
          <DetailField
            label="Variants"
            type="string"
            value={offering.variants.length > 0 ? String(offering.variants.length) : null}
          />
          {priceRange == null ? (
            <DetailField label="Price" type="string" value={null} />
          ) : isRange ? (
            <DetailField
              label="Price"
              type="string"
              value={`${fmt.currency(priceRange.min).primary} – ${fmt.currency(priceRange.max).primary}`}
              mono
            />
          ) : (
            <DetailField label="Price" type="currency" value={priceRange.min} />
          )}
          <DetailField label="Description" type="string" value={offering.description} className="col-span-2" />
        </div>
      </CardContent>
    </Card>
  );
};
