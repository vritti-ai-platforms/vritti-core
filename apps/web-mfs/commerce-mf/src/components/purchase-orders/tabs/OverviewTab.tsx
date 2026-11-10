import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import type React from 'react';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';
import { PurchaseOrderStatusBadge } from '../PurchaseOrderStatusBadge';

interface OverviewTabProps {
  purchaseOrder: PurchaseOrderDetail;
  showSite: boolean;
}

// The order's header: who it is with, when, its total and, in another currency than the legal entity's, its rate
export const OverviewTab: React.FC<OverviewTabProps> = ({ purchaseOrder, showSite }) => {
  const leCurrencyCode = useWorkspaceCurrency();
  const isForeignCurrency = purchaseOrder.currencyCode !== leCurrencyCode;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <DetailField label="PO Number" type="string" mono value={purchaseOrder.poNumber} />
          <DetailField label="Supplier" type="string" value={purchaseOrder.supplierName} />
          {showSite && (
            <DetailField label="Site" type="string" value={purchaseOrder.siteName ?? purchaseOrder.siteCode} />
          )}
          <DetailField
            label="Status"
            type="string"
            value={<PurchaseOrderStatusBadge status={purchaseOrder.status} />}
          />
          <DetailField label="Order Date" type="date" value={purchaseOrder.orderDate} />
          <DetailField label="Tax Date" type="date" value={purchaseOrder.taxDate} />
          <DetailField
            label="Total Amount"
            type="currency"
            value={purchaseOrder.totalAmount}
            exchangeRate={purchaseOrder.exchangeRate}
          />
          {isForeignCurrency && (
            <DetailField
              label={`1 ${purchaseOrder.currencyCode} in ${leCurrencyCode}`}
              type="number"
              value={purchaseOrder.exchangeRate}
            />
          )}
          {Object.entries(purchaseOrder.conversionRates).map(([currencyCode, rate]) => (
            <DetailField
              key={currencyCode}
              label={`1 ${currencyCode} in ${purchaseOrder.currencyCode}`}
              type="number"
              value={rate}
            />
          ))}
          <DetailField
            label="Created At"
            type="dateTime"
            value={purchaseOrder.createdAt}
            timeZone={purchaseOrder.timezone}
          />
          <DetailField label="Notes" type="string" value={purchaseOrder.notes} className="col-span-2" />
        </div>
      </CardContent>
    </Card>
  );
};
