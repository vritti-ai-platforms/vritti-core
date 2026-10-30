import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Plus, Truck } from 'lucide-react';
import type { SupplierAtSiteData } from '@/schemas/site-suppliers';

interface OverviewTabProps {
  supplier: SupplierAtSiteData;
  enrollPermission: string;
  onEnroll: () => void;
}

export const OverviewTab = ({ supplier, enrollPermission, onEnroll }: OverviewTabProps) => (
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
        <CardTitle>Enrollment</CardTitle>
      </CardHeader>
      <CardContent>
        {supplier.enrollmentId ? (
          <div className="grid grid-cols-2 gap-6">
            {supplier.siteName && <DetailField label="Site" type="string" value={supplier.siteName} />}
            <DetailField label="Payment Term" type="string" value={supplier.paymentTermName} />
            <DetailField label="Tax Registration" type="string" mono value={supplier.registrationNumber} />
            <DetailField label="Bank Account" type="string" value={supplier.bankAccountName} />
            <DetailField label="Enrolled" type="dateTime" value={supplier.enrolledAt} />
          </div>
        ) : (
          <Empty
            icon={<Truck className="size-5" />}
            title="Not enrolled"
            description="Enroll this supplier to purchase from it, with its payment term, tax registration, bank account and order contact."
            action={
              <Button permission={enrollPermission} startAdornment={<Plus className="size-4" />} onClick={onEnroll}>
                Enroll Supplier
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  </div>
);
