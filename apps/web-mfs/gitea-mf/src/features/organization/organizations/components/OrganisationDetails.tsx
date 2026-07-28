import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type React from 'react';
import type { OrganisationData } from '@/schemas/organisation';

interface OrganisationDetailsProps {
  organisation: OrganisationData;
}

export const OrganisationDetails: React.FC<OrganisationDetailsProps> = ({ organisation }) => (
  <Card>
    <CardHeader>
      <CardTitle>Git organisation</CardTitle>
      <CardDescription>
        Every repository your team creates lives inside this namespace on the git service.
      </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4 sm:grid-cols-2">
      <DetailField label="Namespace" type="string" value={organisation.namespace} mono />
      <DetailField label="Display name" type="string" value={organisation.fullName || undefined} />
      <DetailField label="Description" type="string" value={organisation.description || undefined} />
      <DetailField label="Website" type="string" value={organisation.website || undefined} />
      <DetailField label="Location" type="string" value={organisation.location || undefined} />
      <DetailField
        label="Visibility"
        type="string"
        value={<Badge variant="outline">{organisation.visibility}</Badge>}
      />
    </CardContent>
  </Card>
);
