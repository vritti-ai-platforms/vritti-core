import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type { PersonData } from '@/schemas/people';

interface OverviewTabProps {
  person: PersonData;
}

export const OverviewTab = ({ person }: OverviewTabProps) => {
  const address = person.primaryAddress;
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
            <DetailField label="First Name" type="string" value={person.firstName} />
            <DetailField label="Last Name" type="string" value={person.lastName} />
            <DetailField label="Email" type="string" value={person.email} />
            <DetailField label="Phone" type="string" value={person.phone} mono />
            <DetailField label="Created" type="dateTime" value={person.createdAt} />
            <DetailField label="Address" type="string" className="col-span-2 md:col-span-3" value={addressText} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
