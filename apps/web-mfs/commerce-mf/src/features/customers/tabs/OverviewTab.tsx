import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type { CustomerDetail } from '@/schemas/customers';

interface OverviewTabProps {
  customer: CustomerDetail;
}

export const OverviewTab = ({ customer }: OverviewTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <DetailField label="Name" value={customer.name} />
          <DetailField label="Phone" value={customer.phone} />
          <DetailField label="Email" value={customer.email} />
          <DetailField
            label="Status"
            value={
              <Badge
                variant={customer.isActive ? 'secondary' : 'outline'}
                className={customer.isActive ? 'bg-success/15 text-success' : undefined}
              >
                {customer.isActive ? 'Active' : 'Inactive'}
              </Badge>
            }
          />
          <DetailField label="Notes" value={customer.notes} className="col-span-2" />
        </div>
      </CardContent>
    </Card>
  );
};
