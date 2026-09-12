import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import type React from 'react';
import type { CatalogData } from '@/schemas/catalogs';

interface OverviewTabProps {
  catalog: CatalogData;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ catalog }) => (
  <div className="grid gap-4 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <DetailField label="Name" type="string" value={catalog.name} />
        <DetailField
          label="Status"
          type="string"
          value={
            <Badge variant={catalog.isActive ? 'success' : 'secondary'}>{catalog.isActive ? 'Active' : 'Draft'}</Badge>
          }
        />
        <DetailField label="Owner" type="string" value={catalog.ownerLegalEntityId ? 'Company' : 'Organization'} />
        <DetailField label="Created" type="dateTime" value={catalog.createdAt} />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Pricing</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <DetailField
          label="Tax treatment"
          type="string"
          value={<Badge variant="outline">{catalog.taxInclusive ? 'Prices include tax' : 'Prices exclude tax'}</Badge>}
        />
        <DetailField
          label="Listings"
          type="string"
          value={
            catalog.listingCount > 0 ? (
              pluralize('listing', catalog.listingCount, true)
            ) : (
              <Badge variant="warning">Nothing listed</Badge>
            )
          }
        />
        <DetailField
          label="Sales channels"
          type="string"
          value={
            catalog.channelCount > 0 ? (
              pluralize('channel', catalog.channelCount, true)
            ) : (
              <Badge variant="warning">Not reachable</Badge>
            )
          }
        />
      </CardContent>
    </Card>
  </div>
);
