import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type React from 'react';
import type { OrganizationData } from '@/schemas/organization';

interface OrganizationDetailsProps {
  organization: OrganizationData;
}

export const OrganizationDetails: React.FC<OrganizationDetailsProps> = ({ organization }) => (
  <Card>
    <CardHeader>
      <CardTitle>Git organization</CardTitle>
      <CardDescription>
        Every repository your team creates lives inside this namespace on the git service.
      </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4 sm:grid-cols-2">
      <DetailField label="Namespace" type="string" value={organization.namespace} mono />
      <DetailField label="Display name" type="string" value={organization.fullName || undefined} />
      <DetailField label="Description" type="string" value={organization.description || undefined} />
      <DetailField label="Website" type="string" value={organization.website || undefined} />
      <DetailField label="Location" type="string" value={organization.location || undefined} />
      <DetailField
        label="Visibility"
        type="string"
        value={<Badge variant="outline">{organization.visibility}</Badge>}
      />
    </CardContent>
  </Card>
);
