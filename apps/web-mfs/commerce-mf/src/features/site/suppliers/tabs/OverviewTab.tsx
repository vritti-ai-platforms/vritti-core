import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type { SiteSupplierRow } from '@/schemas/site-suppliers';

interface OverviewTabProps {
  supplier: SiteSupplierRow;
}

export const OverviewTab = ({ supplier }: OverviewTabProps) => (
  <div className="flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Supplier</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <DetailField label="Company" type="string" value={supplier.partyName} />
          <DetailField label="Code" type="string" mono value={supplier.code} />
          <DetailField label="Currency" type="string" mono value={supplier.currencyCode} />
          <DetailField label="Payment Terms" type="string" value={supplier.paymentTerms} />
          <DetailField label="Order Email" type="string" value={supplier.orderEmail} />
          <DetailField label="Order Phone" type="string" value={supplier.orderPhone} />
          <DetailField
            label="Status"
            type="string"
            value={
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={supplier.isActive ? 'success' : 'outline'}>
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {supplier.purchasingBlocked && <Badge variant="destructive">Purchasing Blocked</Badge>}
                {supplier.paymentBlocked && <Badge variant="destructive">Payment Blocked</Badge>}
              </div>
            }
          />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>This Site's Enrollment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <DetailField
            label="Origin Tax Registration"
            type="string"
            value={
              supplier.registrationNumber ? (
                <span className="font-mono">{supplier.registrationNumber}</span>
              ) : (
                <Badge variant="warning">Not set</Badge>
              )
            }
          />
          <DetailField
            label="Branch Bank"
            type="string"
            value={supplier.bankAccountName ?? <Badge variant="outline">Company primary</Badge>}
          />
          <DetailField
            label="Enrollment Status"
            type="string"
            value={
              <Badge variant={supplier.enrollmentActive ? 'success' : 'outline'}>
                {supplier.enrollmentActive ? 'Active' : 'Inactive'}
              </Badge>
            }
          />
          <DetailField label="Enrolled" type="dateTime" value={supplier.enrolledAt} />
        </div>
      </CardContent>
    </Card>
  </div>
);
