import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { useConfirm, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { PackageCheck, Send, XCircle } from 'lucide-react';
import { useCallback } from 'react';
import { useStockTransfer } from '@/hooks/useStockTransfer';
import { useUpdateStockTransferStatus } from '@/hooks/useUpdateStockTransferStatus';
import type { StockTransferStatus } from '@/schemas/stock-transfers';

const statusConfig: Record<
  StockTransferStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }
> = {
  REQUESTED: { label: 'Requested', variant: 'outline' },
  IN_TRANSIT: { label: 'In Transit', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  RECEIVED: { label: 'Received', variant: 'secondary', className: 'bg-success/15 text-success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export const StockTransferDetailPage = () => {
  const { id } = useSlugParams('transferSlug');
  const { data: transfer, isLoading, refetch } = useStockTransfer(id ?? null);
  const statusMutation = useUpdateStockTransferStatus();
  const confirm = useConfirm();

  const handleStatusChange = useCallback(
    async (nextStatus: StockTransferStatus, label: string) => {
      if (!id) return;
      const confirmed = await confirm({
        title: `${label}?`,
        description: `This will change the transfer status to "${statusConfig[nextStatus].label}".`,
        confirmLabel: label,
        variant: nextStatus === 'CANCELLED' ? 'destructive' : undefined,
      });
      if (confirmed) {
        statusMutation.mutate({ id, status: nextStatus }, { onSuccess: () => refetch() });
      }
    },
    [id, confirm, statusMutation, refetch],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">Stock transfer not found.</div>
    );
  }

  const badgeConfig = statusConfig[transfer.status];
  const canMarkInTransit = transfer.status === 'REQUESTED';
  const canMarkReceived = transfer.status === 'IN_TRANSIT';
  const canCancel = transfer.status === 'REQUESTED' || transfer.status === 'IN_TRANSIT';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Transfer ${transfer.id.slice(0, 8)}`}
        description={transfer.inventoryItemName ?? 'Stock Transfer'}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
              {badgeConfig.label}
            </Badge>
            {canMarkInTransit && (
              <Button
                size="sm"
                startAdornment={<Send className="size-4" />}
                onClick={() => handleStatusChange('IN_TRANSIT', 'Mark In Transit')}
              >
                Mark In Transit
              </Button>
            )}
            {canMarkReceived && (
              <Button
                size="sm"
                startAdornment={<PackageCheck className="size-4" />}
                onClick={() => handleStatusChange('RECEIVED', 'Mark Received')}
              >
                Mark Received
              </Button>
            )}
            {canCancel && (
              <Button
                variant="destructive"
                size="sm"
                startAdornment={<XCircle className="size-4" />}
                onClick={() => handleStatusChange('CANCELLED', 'Cancel Transfer')}
              >
                Cancel
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Inventory Item</p>
              <p className="mt-1 font-medium">{transfer.inventoryItemName ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quantity</p>
              <p className="mt-1 font-mono font-medium">{transfer.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">From</p>
              <p className="mt-1 font-medium">{transfer.fromBuName ?? transfer.fromBuId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">To</p>
              <p className="mt-1 font-medium">{transfer.toBuName ?? transfer.toBuId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requested By</p>
              <p className="mt-1">{transfer.requestedBy ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Received By</p>
              <p className="mt-1">{transfer.receivedBy ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="mt-1">{new Date(transfer.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="mt-1">{new Date(transfer.updatedAt).toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="mt-1">{transfer.notes ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
