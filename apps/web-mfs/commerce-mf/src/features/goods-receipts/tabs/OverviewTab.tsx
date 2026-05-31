import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useBUCurrency } from '@vritti/quantum-ui/hooks';
import type React from 'react';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';

interface OverviewTabProps {
  receipt: GoodsReceiptData;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ receipt }) => {
  const buCurrencyCode = useBUCurrency();
  const supplierCurrencyCode = receipt.supplierCurrencyCode;
  const showExchangeRate = receipt.exchangeRate !== 1;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Receipt Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <DetailField label="GR Number" type="string" mono value={receipt.grNumber} />
            <DetailField label="Supplier" type="string" value={receipt.supplierName} />
            <DetailField label="Supplier Currency" type="string" mono value={supplierCurrencyCode} />
            <DetailField label="Status" type="string" value={receipt.status} />
            <DetailField label="Publishable" type="string" value={receipt.isPublishable ? 'Yes' : 'No'} />
            <DetailField label="Received Date" type="date" value={receipt.receivedDate} />
            {showExchangeRate && (
              <DetailField
                label="Exchange Rate"
                type="string"
                mono
                value={
                  <span>
                    {receipt.exchangeRate}
                    {supplierCurrencyCode && buCurrencyCode && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {supplierCurrencyCode} → {buCurrencyCode}
                      </span>
                    )}
                  </span>
                }
              />
            )}
            <DetailField label="Created At" type="dateTime" value={receipt.createdAt} />
            <DetailField label="Published At" type="dateTime" value={receipt.publishedAt} />
            <DetailField label="Notes" type="string" value={receipt.notes} className="col-span-2" />
          </div>
        </CardContent>
      </Card>

      {receipt.po && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <DetailField label="PO Number" type="string" mono value={receipt.po.poNumber} />
              <DetailField label="Order Date" type="date" value={receipt.po.orderDate} />
              <DetailField label="Expected By" type="dateTime" value={receipt.po.expectedBy} />
              <DetailField label="Total Amount" type="currency" value={receipt.po.totalAmount} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
