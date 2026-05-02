import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Pencil, Tags, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatStrip } from '@/components/StatStrip';
import { useDeletePriceList, usePriceList } from '@/hooks/price-lists';
import { getErrorMessage } from '@/utils/error';
import { PriceListItemsTab } from './components/PriceListItemsTab';
import { PriceListForm } from './forms/PriceListForm';

export const PriceListDetailPage = () => {
  const { id } = useSlugParams('priceListSlug');
  const navigate = useNavigate();
  const { data: priceList, isLoading, error } = usePriceList(id ?? null);
  const editDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeletePriceList();

  const handleDelete = async () => {
    if (!priceList) return;
    const confirmed = await confirm({
      title: `Delete "${priceList.name}"?`,
      description: 'This price list and all its item and terminal assignments will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(priceList.id, { onSuccess: () => navigate('..') });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive" title="Failed to load" description={getErrorMessage(error)} />;
  }

  if (!priceList) {
    return <Empty icon={<Tags />} title="Price list not found" description="This price list no longer exists." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={priceList.name}
        description={priceList.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {priceList.isActive ? (
              <Badge className="bg-success/15 text-success">Active</Badge>
            ) : (
              <Badge variant="outline">Inactive</Badge>
            )}
            <Badge variant="outline">{priceList.code}</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={editDialog.open}
              startAdornment={<Pencil className="size-4" />}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              isLoading={deleteMutation.isPending}
              startAdornment={<Trash2 className="size-4" />}
            >
              Delete
            </Button>
          </div>
        }
      />

      <StatStrip
        stats={[
          { value: priceList.assignedItemsCount, label: 'items' },
          { value: priceList.assignedTerminalsCount, label: 'terminals' },
          { value: 'Updated', label: new Date(priceList.updatedAt).toLocaleDateString() },
        ]}
      />

      <PriceListItemsTab priceList={priceList} />

      <Dialog
        handle={editDialog}
        title="Edit Price List"
        description="Update price list details."
        className="max-w-lg"
        content={(close) => <PriceListForm priceList={priceList} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
