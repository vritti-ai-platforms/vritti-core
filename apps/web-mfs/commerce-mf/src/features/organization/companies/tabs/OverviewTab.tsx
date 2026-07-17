import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { countryFlag } from '@vritti/quantum-ui/selects/iso-country';
import type { CompanyData } from '@/schemas/companies';

interface OverviewTabProps {
  company: CompanyData;
}

export const OverviewTab = ({ company }: OverviewTabProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col gap-8 pt-6">
        <div>
          <h3 className="mb-4 text-sm font-semibold">Details</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <DetailField label="Name" type="string" value={company.name} />
            <DetailField label="Legal Name" type="string" value={company.legalName} />
            <DetailField label="Email" type="string" value={company.email} />
            <DetailField label="Phone" type="string" value={company.phone} />
            <DetailField label="Website" type="string" value={company.website} />
            <DetailField label="Jurisdiction" type="string" value={company.jurisdictionName} />
            <DetailField
              label="Country"
              type="string"
              value={company.countryCode ? `${countryFlag(company.countryCode)} ${company.countryCode}` : null}
            />
            <DetailField label="Created" type="dateTime" value={company.createdAt} />
            <DetailField label="Address" type="string" value={company.address} className="col-span-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
