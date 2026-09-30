import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import type { CatalogsBinding } from './bindings';
import { EditCatalogDialog } from './forms/EditCatalogDialog';
import { ChannelsTab } from './tabs/ChannelsTab';
import { ListingsTab } from './tabs/ListingsTab';
import { OverviewTab } from './tabs/OverviewTab';

interface CatalogDetailPageProps {
  binding: CatalogsBinding;
}

export const CatalogDetailPage: React.FC<CatalogDetailPageProps> = ({ binding }) => {
  const { id } = useSlugParams('slug');
  const { data: catalog } = binding.useCatalog(id);
  const navigate = useNavigate();
  const editDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = binding.useDeleteCatalog();

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Delete "${catalog.name}"?`,
      description: 'The catalog and its channel mappings will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (ok) deleteMutation.mutate(catalog.id, { onSuccess: () => navigate('..') });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6">
      <PageHeader
        title={catalog.name}
        description={catalog.taxInclusive ? 'Prices include tax' : 'Prices exclude tax'}
        titleSlot={
          <Badge variant={catalog.isActive ? 'success' : 'outline'}>{catalog.isActive ? 'Active' : 'Inactive'}</Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            startAdornment={<Pencil className="size-4" />}
            onClick={editDialog.open}
            permission={binding.permissions.edit}
          >
            Edit
          </Button>
        }
      />

      <Tabs
        routeParam="tab"
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <OverviewTab catalog={catalog} />,
          },
          {
            value: 'channels',
            label: 'Channels',
            content: <ChannelsTab binding={binding} catalogId={catalog.id} />,
          },
          {
            value: 'listings',
            label: 'Listings',
            permission: binding.permissions.listings.view,
            content: <ListingsTab binding={binding} catalogId={catalog.id} />,
          },
        ]}
      />

      <DangerZone
        title="Delete this catalog"
        description="This action cannot be undone. Its channel mappings are removed with it."
        buttonText="Delete Catalog"
        permission={binding.permissions.delete}
        onClick={handleDelete}
        disabled={catalog.listingCount > 0}
        warning={`This catalog still holds ${pluralize('listing', catalog.listingCount, true)}. Remove them first.`}
        showWarning={catalog.listingCount > 0}
      />

      <Dialog
        handle={editDialog}
        icon={Pencil}
        title="Edit Catalog"
        description="Rename it, switch its tax treatment, or take it out of service."
        content={(close) => (
          <EditCatalogDialog binding={binding} catalog={catalog} onSuccess={close} onCancel={close} />
        )}
      />
    </div>
  );
};
