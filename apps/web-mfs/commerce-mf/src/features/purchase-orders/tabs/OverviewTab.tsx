import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';

interface OverviewTabProps {
  po: PurchaseOrderDetail;
  status: {
    label: string;
    variant: 'secondary' | 'outline' | 'destructive';
    className?: string;
  };
}

export const OverviewTab = ({ po, status }: OverviewTabProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Details</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-6">
        <DetailField label="PO Number" value={<span className="font-mono font-medium">{po.poNumber}</span>} />
        <DetailField label="Supplier" value={po.supplierName} />
        <DetailField label="Order Date" value={po.orderDate} dateFormat="dd/MM/yyyy" />
        <DetailField
          label="Expected By"
          value={po.expectedBy ?? '—'}
          dateFormat={po.expectedBy ? 'dd/MM/yyyy' : undefined}
        />
        <DetailField label="Created At" value={po.createdAt} dateFormat="dd/MM/yyyy HH:mm" />
        <DetailField
          label="Status"
          value={
            <Badge variant={status.variant} className={status.className}>
              {status.label}
            </Badge>
          }
        />
        <DetailField
          label="Total Amount"
          value={
            po.totalAmount != null ? <span className="font-mono font-medium">{po.totalAmount.toFixed(2)}</span> : '—'
          }
        />
        <DetailField label="Notes" value={po.notes ?? '—'} className="col-span-2" />
      </div>
    </CardContent>
  </Card>
);
