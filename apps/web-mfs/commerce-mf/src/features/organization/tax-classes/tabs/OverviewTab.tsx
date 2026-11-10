import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type { TaxClassData } from '@/schemas/tax-classes';

interface OverviewTabProps {
  taxClass: TaxClassData;
}

export const OverviewTab = ({ taxClass }: OverviewTabProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Details</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-6">
        <DetailField label="Code" type="string" value={taxClass.code} mono />
        <DetailField label="Name" type="string" value={taxClass.name} />
        <DetailField label="Source" type="string" value={taxClass.isSystem ? 'System' : 'Custom'} />
        <DetailField label="Created" type="dateTime" value={taxClass.createdAt} />
        <DetailField label="Updated" type="dateTime" value={taxClass.updatedAt} />
      </div>
    </CardContent>
  </Card>
);
