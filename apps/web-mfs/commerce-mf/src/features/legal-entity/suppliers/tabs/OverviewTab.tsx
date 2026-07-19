import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import type { ReactNode } from 'react';
import { LICENSE_TYPE_LABELS } from '@/schemas/party-licenses';
import type { SupplierDetail } from '@/schemas/suppliers';

interface OverviewTabProps {
  supplier: SupplierDetail;
}

const EXPIRY_SOON_DAYS = 30;

function expiryBadge(validTo: string | null): ReactNode {
  if (!validTo) return null;
  const expiry = new Date(validTo);
  if (Number.isNaN(expiry.getTime())) return null;
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + EXPIRY_SOON_DAYS);
  if (expiry < now) return <Badge variant="destructive">Expired</Badge>;
  if (expiry <= soon) return <Badge variant="warning">Expiring soon</Badge>;
  return null;
}

export const OverviewTab = ({ supplier }: OverviewTabProps) => {
  const fmt = useFormatters();

  return (
    <div className="flex flex-col gap-6">
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
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={supplier.isActive ? 'success' : 'outline'}>
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {supplier.purchasingBlocked && <Badge variant="destructive">Purchasing Blocked</Badge>}
                  {supplier.paymentBlocked && <Badge variant="destructive">Payment Blocked</Badge>}
                </div>
              }
            />
            <DetailField label="Order Email" type="string" value={supplier.orderEmail} />
            <DetailField label="Order Phone" type="string" value={supplier.orderPhone} />
            <DetailField label="Notes" type="string" value={supplier.notes} className="col-span-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tax Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {supplier.registrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tax registrations on the linked company.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {supplier.registrations.map((registration) => (
                  <li
                    key={registration.id}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-sm">{registration.registrationNumber}</span>
                      <Badge variant="outline">{registration.registrationType}</Badge>
                    </div>
                    {registration.isPrimary && <Badge variant="success">Primary</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Licenses</CardTitle>
          </CardHeader>
          <CardContent>
            {supplier.licenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No licenses on the linked company.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {supplier.licenses.map((license) => (
                  <li
                    key={license.id}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-sm">{license.licenseNumber}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{LICENSE_TYPE_LABELS[license.licenseType]}</Badge>
                        {license.region && <span className="text-xs text-muted-foreground">{license.region}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {license.validTo && (
                        <span className="text-xs text-muted-foreground">{fmt.date(license.validTo).primary}</span>
                      )}
                      {expiryBadge(license.validTo)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
