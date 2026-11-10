import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type React from 'react';
import { type InboundDeliveryData, inboundDeliverySourceConfig } from '@/schemas/inbound-deliveries';
import { InboundDeliveryStatusBadge } from '../InboundDeliveryStatusBadge';

interface OverviewTabProps {
  delivery: InboundDeliveryData;
  showSite: boolean;
  children?: React.ReactNode;
}

// The delivery's header: who sends it, whether it was announced or created by a goods receipt, when and how it travels, the supplier's delivery note, and the purchase orders it carries goods of
export const OverviewTab: React.FC<OverviewTabProps> = ({ delivery, showSite, children }) => (
  <div className="flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <DetailField label="Delivery Number" type="string" mono value={delivery.deliveryNumber} />
          <DetailField label="Supplier" type="string" value={delivery.supplierName} />
          {showSite && <DetailField label="Site" type="string" value={delivery.siteName ?? delivery.siteCode} />}
          <DetailField label="Status" type="string" value={<InboundDeliveryStatusBadge status={delivery.status} />} />
          <DetailField label="Source" type="string" value={inboundDeliverySourceConfig[delivery.source].label} />
          {delivery.source === 'RECEIPT' && (
            <DetailField label="Created by Receipt" type="string" mono value={delivery.sourceGrNumber} />
          )}
          <DetailField label="Expected Delivery Date" type="date" value={delivery.expectedDeliveryDate} />
          <DetailField label="Carrier" type="string" value={delivery.carrier} />
          <DetailField label="Tracking Number" type="string" mono value={delivery.trackingNumber} />
          <DetailField
            label="Supplier Delivery Note No."
            type="string"
            mono
            value={delivery.supplierDeliveryNoteNumber}
          />
          <DetailField label="Delivery Note Date" type="date" value={delivery.supplierDeliveryNoteDate} />
          <DetailField
            label="Purchase Orders"
            type="string"
            mono
            value={delivery.poNumbers.length > 0 ? delivery.poNumbers.join(', ') : null}
          />
          <DetailField label="Lines" type="number" value={delivery.lineCount} />
          <DetailField label="Goods Receipts" type="number" value={delivery.goodsReceiptCount} />
          <DetailField label="Created At" type="dateTime" value={delivery.createdAt} />
          <DetailField label="Notes" type="string" value={delivery.notes} className="col-span-2" />
        </div>
      </CardContent>
    </Card>
    {children}
  </div>
);
