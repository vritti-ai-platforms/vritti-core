import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { countryFlag } from '@vritti/quantum-ui/selects/iso-country';
import type { PersonData } from '@/schemas/people';

interface OverviewTabProps {
  person: PersonData;
}

export const OverviewTab = ({ person }: OverviewTabProps) => {
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
            <DetailField
              label="Country"
              type="string"
              value={person.countryCode ? `${countryFlag(person.countryCode)} ${person.countryCode}` : null}
            />
            <DetailField label="Created" type="dateTime" value={person.createdAt} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
