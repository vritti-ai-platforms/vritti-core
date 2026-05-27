import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useBUCurrency } from '@vritti/quantum-ui/hooks';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';

interface OverviewTabProps {
  po: PurchaseOrderDetail;
  status: {
    label: string;
    variant: 'secondary' | 'outline' | 'destructive';
    className?: string;
  };
}

export const OverviewTab = ({ po, status }: OverviewTabProps) => {
  const buCurrency = useBUCurrency();
  const isCrossCurrency = !!buCurrency && buCurrency !== po.currencyCode;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <DetailField label="PO Number" type="string" mono value={po.poNumber} />
          <DetailField label="Supplier" type="string" value={po.supplierName} />
          <DetailField label="Order Date" type="date" value={po.orderDate} />
          <DetailField label="Expected By" type="dateTime" value={po.expectedBy} timeZone={po.timezone} />
          <DetailField label="Created At" type="dateTime" value={po.createdAt} timeZone={po.timezone} />
          <DetailField
            label="Status"
            type="string"
            value={
              <Badge variant={status.variant} className={status.className}>
                {status.label}
              </Badge>
            }
          />
          <DetailField label="Total Amount" type="currency" value={po.totalAmount} exchangeRate={po.exchangeRate} />
          {isCrossCurrency && (
            <DetailField
              label={`Exchange Rate (${po.currencyCode} → ${buCurrency})`}
              type="number"
              value={po.exchangeRate}
            />
          )}
          <DetailField label="Notes" type="string" value={po.notes} className="col-span-2" />
        </div>
      </CardContent>
    </Card>
  );
};
