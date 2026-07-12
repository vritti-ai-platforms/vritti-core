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
          <DetailField label="Name" type="string" value={supplier.name} />
          <DetailField label="Code" type="string" mono value={supplier.code} />
          <DetailField label="Currency" type="string" mono value={supplier.currencyCode} />
          <DetailField label="Contact Name" type="string" value={supplier.contactName} />
          <DetailField label="Phone" type="string" value={supplier.phone} />
          <DetailField label="Email" type="string" value={supplier.email} />
          <DetailField label="Website" type="string" value={supplier.website} />
          <DetailField label="Address" type="string" value={supplier.address} />
          <DetailField label="Tax ID" type="string" mono value={supplier.taxId} />
          <DetailField
            label="Tax ID Type"
            type="string"
            value={supplier.taxIdType ? supplier.taxIdType.replace('_', ' ') : null}
          />
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
