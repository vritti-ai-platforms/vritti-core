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
          <DetailField label="Name" value={supplier.name} />
          <DetailField label="Code" value={supplier.code} number />
          <DetailField label="Currency" value={supplier.currencyCode} number />
          <DetailField label="Contact Name" value={supplier.contactName} />
          <DetailField label="Phone" value={supplier.phone} />
          <DetailField label="Email" value={supplier.email} />
          <DetailField label="Website" value={supplier.website} />
          <DetailField label="Address" value={supplier.address} />
          <DetailField label="Tax ID" value={supplier.taxId} number />
          <DetailField label="Tax ID Type" value={supplier.taxIdType ? supplier.taxIdType.replace('_', ' ') : null} />
          <DetailField label="Payment Terms" value={supplier.paymentTerms} />
          <DetailField label="Lead Time" value={supplier.leadTimeDays != null ? `${supplier.leadTimeDays} days` : null} />
          <DetailField
            label="Status"
            value={
              <Badge
                variant={supplier.isActive ? 'secondary' : 'outline'}
                className={supplier.isActive ? 'bg-success/15 text-success' : undefined}
              >
                {supplier.isActive ? 'Active' : 'Inactive'}
              </Badge>
            }
          />
          <DetailField label="Notes" value={supplier.notes} className="col-span-2" />
        </div>
      </CardContent>
    </Card>
  );
};
