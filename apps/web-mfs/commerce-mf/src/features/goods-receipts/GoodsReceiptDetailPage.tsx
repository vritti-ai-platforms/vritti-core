import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { useGoodsReceipt } from '@/hooks/useGoodsReceipt';

export const GoodsReceiptDetailPage = () => {
  const { id } = useSlugParams('grSlug');
  const { data: receipt, isLoading } = useGoodsReceipt(id ?? null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!receipt) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Goods receipt not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Goods Receipt ${receipt.grNumber}`}
        description={receipt.supplierName ?? receipt.supplierId}
        actions={<Badge variant="outline">{receipt.poNumber ? `PO: ${receipt.poNumber}` : 'Standalone'}</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Receipt Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Received Date</p>
              <p className="mt-1">{new Date(receipt.receivedDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Received By</p>
              <p className="mt-1">{receipt.receivedBy ?? '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="mt-1">{receipt.notes ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {receipt.items.length === 0 ? (
            <p className="text-muted-foreground">No line items.</p>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
