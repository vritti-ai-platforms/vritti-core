import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type { CompanyData } from '@/schemas/companies';

interface OverviewTabProps {
  company: CompanyData;
}

export const OverviewTab = ({ company }: OverviewTabProps) => {
  const address = company.primaryAddress;
  const addressText = address
    ? [address.line1, address.line2, address.city, address.region, address.postalCode, address.countryCode]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-8 pt-6">
        <div>
          <h3 className="mb-4 text-sm font-semibold">Details</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <DetailField label="Name" type="string" value={company.displayName} />
            <DetailField label="Legal Name" type="string" value={company.legalName} />
            <DetailField label="Email" type="string" value={company.email} />
            <DetailField label="Phone" type="string" value={company.phone} />
            <DetailField label="Website" type="string" value={company.website} />
            <DetailField label="Jurisdiction" type="string" value={company.jurisdictionName} />
            <DetailField label="Created" type="dateTime" value={company.createdAt} />
            <DetailField label="Address" type="string" className="col-span-2 md:col-span-3" value={addressText} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
