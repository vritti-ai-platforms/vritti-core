import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';

interface LineItemsTabProps {
  receipt: GoodsReceiptData;
}

export const LineItemsTab = ({ receipt }: LineItemsTabProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Line Items</CardTitle>
    </CardHeader>
    <CardContent>
      {receipt.items.length === 0 ? (
        <p className="text-muted-foreground">No line items yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium text-right">Accepted</th>
                <th className="pb-2 font-medium text-right">Rejected</th>
                <th className="pb-2 font-medium">Reason</th>
                <th className="pb-2 font-medium">Batch</th>
                <th className="pb-2 font-medium">Mfg Date</th>
                <th className="pb-2 font-medium">Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">{item.inventoryItemName ?? item.inventoryItemId}</td>
                  <td className="py-2 text-right font-mono">{item.acceptedQuantity}</td>
                  <td className="py-2 text-right font-mono">{item.rejectedQuantity}</td>
                  <td className="py-2 text-muted-foreground">{item.rejectionReason ?? '—'}</td>
                  <td className="py-2 font-mono">{item.batchNumber ?? '—'}</td>
                  <td className="py-2">{item.manufacturingDate ? new Date(item.manufacturingDate).toLocaleDateString() : '—'}</td>
                  <td className="py-2">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);
