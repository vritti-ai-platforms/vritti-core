import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Package, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteItem } from '@/hooks/items';
import { useItem } from '@/hooks/items';
import { useItemModifiers } from '@/hooks/items';
import { EditItemForm } from './forms/EditItemForm';
import { ModifiersTab } from './tabs/ModifiersTab';
import { OverviewTab } from './tabs/OverviewTab';
import { VariationsTab } from './tabs/VariationsTab';

export const ItemFormPage = () => {
  const { id } = useSlugParams('itemSlug');
  const { data: item, isLoading } = useItem(id ?? null);
  const { data: modifierGroups = [] } = useItemModifiers(id ?? null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const editDialog = useDialog();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const deleteMutation = useDeleteItem({ onSuccess: () => navigate('..', { relative: 'path' }) });

  const handleDelete = useCallback(async () => {
    if (!item) return;
    const confirmed = await confirm({
      title: `Delete "${item.name}"?`,
      description: 'This item will be permanently removed. This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(item.id);
  }, [confirm, deleteMutation, item]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (!item) {
    return <Empty icon={<Package />} title="Item not found" description="This item no longer exists." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.name}
        description={item.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {item.isAvailable ? (
              <Badge className="bg-success/15 text-success">Available</Badge>
            ) : (
              <Badge variant="outline">Unavailable</Badge>
            )}
            <Badge variant="outline">{item.type === 'PRODUCT' ? 'Product' : 'Service'}</Badge>
            <Button
              variant="outline"
              size="sm"
              startAdornment={<Pencil className="size-4" />}
              onClick={editDialog.open}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              startAdornment={<Trash2 className="size-4" />}
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Typography variant="caption" className="font-mono">
          {item.code}
        </Typography>
        {item.categoryName && (
          <Typography variant="body2" intent="muted">
            <span className="font-medium text-foreground">{item.categoryName}</span>
          </Typography>
        )}
        <Typography variant="body2" intent="muted">
          <span className="font-medium text-foreground">{item.variants.length}</span>{' '}
          {pluralize('variant', item.variants.length)}
        </Typography>
        <Typography variant="body2" intent="muted">
          <span className="font-medium text-foreground">{modifierGroups.length}</span>{' '}
          {pluralize('modifier group', modifierGroups.length)}
        </Typography>
      </div>

      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview', content: <OverviewTab item={item} /> },
          { value: 'variations', label: 'Variations', content: <VariationsTab item={item} /> },
          { value: 'modifiers', label: 'Modifiers', content: <ModifiersTab item={item} /> },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <Dialog
        handle={editDialog}
        title="Edit Item"
        description="Update the details for this item."
        content={(close) => <EditItemForm item={item} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
