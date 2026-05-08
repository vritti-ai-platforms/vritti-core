import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDeleteInventoryItemBatch, useInventoryItemBatch } from '@/hooks/inventory-item-batches';
import type { InventoryItemBatchStatus } from '@/schemas/inventory-item-batches';
import { BatchLedgerTab } from './tabs/BatchLedgerTab';

function getBatchStatus(expiryDate: string | null): InventoryItemBatchStatus {
  if (!expiryDate) return 'FRESH';
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 7) return 'EXPIRING_SOON';
  return 'FRESH';
}

const STATUS_CONFIG: Record<
  InventoryItemBatchStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' }
> = {
  EXPIRED: { label: 'Expired', variant: 'destructive' },
  EXPIRING_SOON: { label: 'Expiring Soon', variant: 'secondary' },
  FRESH: { label: 'Fresh', variant: 'default' },
};

export const BatchDetailPage = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: batch, isLoading } = useInventoryItemBatch(batchId ?? null);
  const deleteMutation = useDeleteInventoryItemBatch(batch?.inventoryItemId ?? '');

  const handleDelete = async () => {
    if (!batch) return;
    const confirmed = await confirm({
      title: `Delete batch ${batch.batchNumber ?? 'Auto'}?`,
      description: 'This batch and all its ledger entries will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(batch.id, { onSuccess: () => navigate('..') });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!batch) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Batch not found.</div>;
  }

  const status = getBatchStatus(batch.expiryDate);
  const statusConfig = STATUS_CONFIG[status];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Batch ${batch.batchNumber ?? 'Auto'}`}
        description={
          batch.locationPath
            ? `${batch.locationPath} › ${batch.locationName ?? ''}`
            : (batch.locationName ?? '—')
        }
        actions={
          batch.canDelete ? (
            <Button
              variant="destructive"
              size="sm"
              startAdornment={<Trash2 className="size-4" />}
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete Batch
            </Button>
          ) : undefined
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Batch Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-6">
                    <div>
                      <dt className="text-sm text-muted-foreground">Location</dt>
                      <dd className="mt-1 font-medium">{batch.locationName ?? '—'}</dd>
                      {batch.locationPath && (
                        <dd className="text-xs text-muted-foreground">{batch.locationPath}</dd>
                      )}
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Batch Number</dt>
                      <dd className="mt-1 font-mono">{batch.batchNumber ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Quantity</dt>
                      <dd className="mt-1 font-mono">{batch.quantity}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Reserved</dt>
                      <dd className="mt-1 font-mono">{batch.reservedQuantity}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Available</dt>
                      <dd className="mt-1 font-mono font-semibold text-success">{batch.availableQuantity}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Status</dt>
                      <dd className="mt-1">
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Manufacturing Date</dt>
                      <dd className="mt-1 font-mono">
                        {batch.manufacturingDate ? new Date(batch.manufacturingDate).toLocaleDateString() : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Expiry Date</dt>
                      <dd className="mt-1 font-mono">
                        {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Source</dt>
                      <dd className="mt-1">{batch.goodsReceiptItemId ? 'Goods Receipt' : 'Manual Entry'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Created</dt>
                      <dd className="mt-1 text-muted-foreground">{new Date(batch.createdAt).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ),
          },
          {
            value: 'ledger',
            label: 'Ledger',
            content: <BatchLedgerTab batchId={batch.id} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />
    </div>
  );
};
