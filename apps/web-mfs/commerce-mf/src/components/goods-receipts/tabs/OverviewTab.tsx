import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type React from 'react';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import { inboundDeliverySourceConfig } from '@/schemas/inbound-deliveries';
import type { GoodsReceiptsBinding } from '../bindings';
import { GoodsReceiptStatusBadge } from '../GoodsReceiptStatusBadge';

interface OverviewTabProps {
  binding: GoodsReceiptsBinding;
  receipt: GoodsReceiptData;
}

// The receipt's header with its supplier, purchase orders and inbound delivery (source, carrier, tracking, supplier's delivery note), and its provisional value
export const OverviewTab: React.FC<OverviewTabProps> = ({ binding, receipt }) => {
  const { data: cost } = binding.useItemsCost(receipt.id);

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
            {binding.spansSites && (
              <DetailField label="Site" type="string" value={receipt.siteName ?? receipt.siteCode} />
            )}
            <DetailField label="Status" type="string" value={<GoodsReceiptStatusBadge status={receipt.status} />} />
            <DetailField label="Purchase Orders" type="string" mono value={receipt.poNumbers.join(', ')} />
            <DetailField label="Inbound Delivery" type="string" mono value={receipt.deliveryNumber} />
            <DetailField
              label="Delivery Source"
              type="string"
              value={inboundDeliverySourceConfig[receipt.deliverySource].label}
            />
            <DetailField label="Carrier" type="string" value={receipt.carrier} />
            <DetailField label="Tracking Number" type="string" mono value={receipt.trackingNumber} />
            <DetailField
              label="Supplier Delivery Note No."
              type="string"
              mono
              value={receipt.supplierDeliveryNoteNumber}
            />
            <DetailField label="Delivery Note Date" type="date" value={receipt.supplierDeliveryNoteDate} />
            <DetailField label="Expected Delivery" type="date" value={receipt.expectedDeliveryDate} />
            <DetailField label="Received Date" type="date" value={receipt.receivedDate} />
            <DetailField label="Provisional Value" type="currency" value={cost?.grandTotal} />
            <DetailField label="Created At" type="dateTime" value={receipt.createdAt} />
            <DetailField label="Published At" type="dateTime" value={receipt.publishedAt} />
            <DetailField label="Notes" type="string" value={receipt.notes} className="col-span-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
