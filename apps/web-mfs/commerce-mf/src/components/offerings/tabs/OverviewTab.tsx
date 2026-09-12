import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type React from 'react';
import { FULFILMENT_TYPE_META, type OfferingData } from '@/schemas/offerings';

const OWNER_LABEL: Record<OfferingData['ownerScope'], string> = { ORG: 'Organization', LE: 'Company', SITE: 'Outlet' };

interface OverviewTabProps {
  offering: OfferingData;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ offering }) => {
  const meta = FULFILMENT_TYPE_META[offering.fulfilmentType];
  const missingBom = offering.variantsMissingBomCount;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailField label="Code" type="string" value={offering.code} mono />
            <DetailField label="Fulfilment type" type="string" value={<Badge variant="outline">{meta.label}</Badge>} />
            <DetailField label="Owner" type="string" value={OWNER_LABEL[offering.ownerScope]} />
            <DetailField
              label="Status"
              type="string"
              value={
                <Badge variant={offering.isActive ? 'success' : 'secondary'}>
                  {offering.isActive ? 'Active' : 'Draft'}
                </Badge>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">{offering.description ?? meta.description}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <div className="text-muted-foreground text-xs">Dimensions</div>
            <div className="font-mono font-semibold text-2xl">{offering.dimensionCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-muted-foreground text-xs">Variants</div>
            <div className="font-mono font-semibold text-2xl">{offering.variantCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-muted-foreground text-xs">Not sellable yet</div>
            <div className="font-mono font-semibold text-2xl">{missingBom}</div>
            <div className="text-muted-foreground text-xs">
              {missingBom === 0 ? 'every variant has what it needs' : 'waiting on a bill of materials'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
