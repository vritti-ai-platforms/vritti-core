import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useGoodsReceipt } from '@/hooks/goods-receipts/useGoodsReceipt';

export const GoodsReceiptOverviewCard = ({ id }: { id: string }) => {
  const { data: receipt } = useGoodsReceipt(id);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Receipt Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <DetailField label="GR Number" value={receipt.grNumber} number />
            <DetailField label="Supplier" value={receipt.supplierName} />
            <DetailField label="Status" value={receipt.status} />
            <DetailField label="Publishable" value={receipt.isPublishable ? 'Yes' : 'No'} />
            <DetailField label="Received Date" value={receipt.receivedDate} dateFormat="dd/MM/yyyy" dateOnly />
            <DetailField label="Received By" value={receipt.receivedBy} />
            <DetailField label="Created At" value={receipt.createdAt} dateFormat="dd/MM/yyyy HH:mm" />
            <DetailField label="Published At" value={receipt.publishedAt} dateFormat="dd/MM/yyyy HH:mm" />
            <DetailField label="Notes" value={receipt.notes} className="col-span-2" />
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
              <DetailField label="PO Number" value={receipt.po.poNumber} number />
              <DetailField label="Order Date" value={receipt.po.orderDate} dateFormat="dd/MM/yyyy" dateOnly />
              <DetailField label="Expected By" value={receipt.po.expectedBy} dateFormat="dd/MM/yyyy HH:mm" />
              <DetailField
                label="Total Amount"
                value={
                  receipt.po.totalAmount != null
                    ? `${receipt.po.totalAmount.currency} ${receipt.po.totalAmount.value}`
                    : null
                }
                number
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
