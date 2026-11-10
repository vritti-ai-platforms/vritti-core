import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { countryFlag } from '@vritti/quantum-ui/selects/iso-country';
import type { TaxGroupData } from '@/schemas/tax-groups';
import { TaxTreatmentBadge } from '../components/TaxTreatmentBadge';

interface OverviewTabProps {
  taxGroup: TaxGroupData;
}

export const OverviewTab = ({ taxGroup }: OverviewTabProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Details</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-6">
        <DetailField
          label="Country"
          type="string"
          value={`${countryFlag(taxGroup.countryCode)} ${taxGroup.countryCode}`}
        />
        <DetailField label="Code" type="string" value={taxGroup.code} mono />
        <DetailField label="Name" type="string" value={taxGroup.name} />
        <DetailField label="Treatment" type="string" value={<TaxTreatmentBadge treatment={taxGroup.treatment} />} />
        <DetailField label="Rates" type="number" value={taxGroup.rateCount} />
        <DetailField label="Classes" type="number" value={taxGroup.classCount} />
        <DetailField label="Updated" type="dateTime" value={taxGroup.updatedAt} />
        <div className="col-span-2">
          <DetailField label="Legal Text" type="string" value={taxGroup.legalText} />
        </div>
      </div>
    </CardContent>
  </Card>
);
