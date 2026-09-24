import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import type React from 'react';
import { FULFILMENT_TYPE_META, type OfferingData, type OfferingVariantData } from '@/schemas/offerings';

interface OverviewTabProps {
  offering: OfferingData;
  variant: OfferingVariantData;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ offering, variant }) => {
  const meta = FULFILMENT_TYPE_META[variant.fulfilmentType];
  const needsBom = variant.bomLineCount < meta.minBomLines;

  return (
    <div className="flex flex-col gap-4">
      {needsBom && (
        <Alert
          variant="warning"
          title="Not sellable yet"
          description={`A ${meta.label.toLowerCase()} variant needs ${pluralize('bill of materials line', meta.minBomLines, true)} before it can be made active. Add one on the Bill of Materials tab.`}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailField label="SKU" type="string" value={variant.sku} mono />
          <DetailField label="External SKU" type="string" value={variant.externalSku} mono />
          <DetailField label="Offering" type="string" value={offering.name} />
          <DetailField label="Fulfilment" type="string" value={<Badge variant="outline">{meta.label}</Badge>} />
          <DetailField
            label="Fulfilment source"
            type="string"
            value={
              variant.isFulfilmentOverridden ? (
                <Badge variant="outline">Pinned to this variant</Badge>
              ) : (
                <Badge variant="secondary">Follows {offering.name}</Badge>
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Combination</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {variant.values.map((value) => (
            <DetailField key={value.dimensionId} label={value.dimensionName} type="string" value={value.value} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailField label="Tax Class" type="string" value={variant.taxClassName} />
          <DetailField
            label="Source"
            type="string"
            value={
              variant.isTaxClassOverridden ? (
                <Badge variant="outline">Pinned to this variant</Badge>
              ) : (
                <Badge variant="secondary">Follows {offering.name}</Badge>
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Selling</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailField label="Sold in" type="string" value={variant.salesUomName} />
          <DetailField
            label="Status"
            type="string"
            value={
              <Badge variant={variant.isActive ? 'success' : 'secondary'}>
                {variant.isActive ? 'Active' : 'Draft'}
              </Badge>
            }
          />
          <DetailField label="Created" type="dateTime" value={variant.createdAt} />
        </CardContent>
      </Card>
    </div>
  );
};
