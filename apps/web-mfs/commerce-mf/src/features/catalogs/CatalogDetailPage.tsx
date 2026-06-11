import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { BookOpen, Copy, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCatalog, useDeleteCatalog } from '@/hooks/catalogs';
import { CatalogForm } from './forms/CatalogForm';
import { CloneCatalogDialog } from './forms/CloneCatalogDialog';
import { ModifiersTab } from './tabs/ModifiersTab';
import { OfferingsTab } from './tabs/OfferingsTab';
import { VariantOptionsTab } from './tabs/VariantOptionsTab';

export const CatalogDetailPage = () => {
  const { id } = useSlugParams('catalogSlug');
  const navigate = useNavigate();
  const { data: catalog } = useCatalog(id);
  const editDialog = useDialog();
  const cloneDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeleteCatalog();
  const [activeTab, setActiveTab] = useState<string>('offerings');

  const handleDelete = async () => {
    if (!catalog) return;
    const confirmed = await confirm({
      title: 'Delete this catalog?',
      description: 'This catalog and all its offerings and modifier groups will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(catalog.id, { onSuccess: () => navigate('..') });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={catalog.name}
        titleSlot={
          <div className="flex items-center gap-2">
            {catalog.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
            <Badge variant="outline">{catalog.taxInclusive ? 'Tax inclusive' : 'Tax exclusive'}</Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cloneDialog.open} startAdornment={<Copy className="size-4" />}>
              Clone
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={editDialog.open}
              startAdornment={<Pencil className="size-4" />}
            >
              Edit
            </Button>
          </div>
        }
      />

      <Tabs
        tabs={[
          { value: 'offerings', label: 'Offerings', content: <OfferingsTab catalog={catalog} /> },
          { value: 'options', label: 'Options', content: <VariantOptionsTab catalogId={catalog.id} /> },
          { value: 'modifiers', label: 'Modifiers', content: <ModifiersTab catalogId={catalog.id} /> },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <DangerZone
        title="Delete this catalog"
        description="Permanently remove this catalog and all its offerings and modifier groups. This action cannot be undone."
        buttonText="Delete"
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
        isLoading={deleteMutation.isPending}
      />

      <Dialog
        handle={editDialog}
        icon={BookOpen}
        title="Edit Catalog"
        description="Update catalog details."
        className="max-w-lg"
        content={(close) => <CatalogForm catalog={catalog} onSuccess={close} onCancel={close} />}
      />

      <Dialog
        handle={cloneDialog}
        icon={BookOpen}
        title="Clone Catalog"
        description="Create a new catalog from a copy of this one."
        className="max-w-lg"
        content={(close) => <CloneCatalogDialog catalog={catalog} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
