import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
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
        <div>
          <p className="text-sm text-muted-foreground">PO Number</p>
          <p className="mt-1 font-mono font-medium">{po.poNumber}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Supplier</p>
          <p className="mt-1 font-medium">{po.supplierName ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Order Date</p>
          <p className="mt-1">{new Date(po.orderDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Expected By</p>
          <p className="mt-1">{po.expectedBy ? new Date(po.expectedBy).toLocaleDateString() : '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Created At</p>
          <p className="mt-1">{new Date(po.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge variant={status.variant} className={`mt-1 ${status.className ?? ''}`}>
            {status.label}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="mt-1 font-mono font-medium">{po.totalAmount != null ? po.totalAmount.toFixed(2) : '—'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-muted-foreground">Notes</p>
          <p className="mt-1">{po.notes ?? '—'}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);
