import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type { SupplierDetail } from '@/schemas/suppliers';

interface OverviewTabProps {
  supplier: SupplierDetail;
}

export const OverviewTab = ({ supplier }: OverviewTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <DetailField label="Company" type="string" value={supplier.partyName} />
          <DetailField label="Code" type="string" mono value={supplier.code} />
          <DetailField label="Currency" type="string" mono value={supplier.currencyCode} />
          <DetailField label="Payment Terms" type="string" value={supplier.paymentTerms} />
          <DetailField
            label="Lead Time"
            type="string"
            value={supplier.leadTimeDays != null ? `${supplier.leadTimeDays} days` : null}
          />
          <DetailField
            label="Status"
            type="string"
            value={
              <Badge
                variant={supplier.isActive ? 'secondary' : 'outline'}
                className={supplier.isActive ? 'bg-success/15 text-success' : undefined}
              >
                {supplier.isActive ? 'Active' : 'Inactive'}
              </Badge>
            }
          />
          <DetailField label="Notes" type="string" value={supplier.notes} className="col-span-2" />
        </div>
      </CardContent>
    </Card>
  );
};
