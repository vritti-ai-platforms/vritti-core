import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { BookOpen, Pencil } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteOffering, useOffering } from '@/hooks/offerings';
import { EditOfferingForm } from './forms/offerings/EditOfferingForm';
import { ModifiersTab } from './tabs/offering/ModifiersTab';
import { OverviewTab } from './tabs/offering/OverviewTab';
import { VariationsTab } from './tabs/offering/VariationsTab';

export const OfferingDetailPage = () => {
  const { id: catalogId } = useSlugParams('catalogSlug');
  const { id: offeringId } = useSlugParams('offeringSlug');
  const { data: offering } = useOffering(catalogId ?? '', offeringId ?? '');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const editDialog = useDialog();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const deleteMutation = useDeleteOffering({ onSuccess: () => navigate('..', { relative: 'path' }) });

  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: `Delete "${offering.name}"?`,
      description: 'This offering will be permanently removed. This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate({ catalogId: catalogId ?? '', offeringId: offering.id });
  }, [confirm, deleteMutation, offering, catalogId]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={offering.name}
        titleSlot={
          offering.isAvailable ? (
            <Badge variant="success">Available</Badge>
          ) : (
            <Badge variant="outline">Unavailable</Badge>
          )
        }
        description={offering.categoryPath ?? undefined}
        actions={
          <Button variant="outline" size="sm" startAdornment={<Pencil className="size-4" />} onClick={editDialog.open}>
            Edit
          </Button>
        }
      />

      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview', content: <OverviewTab offering={offering} /> },
          {
            value: 'variations',
            label: 'Variations',
            content: <VariationsTab catalogId={catalogId ?? ''} offering={offering} />,
          },
          {
            value: 'modifiers',
            label: 'Modifiers',
            content: <ModifiersTab catalogId={catalogId ?? ''} offering={offering} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <DangerZone
        title="Delete this offering"
        description="Permanently remove this offering and its variants. This action cannot be undone."
        buttonText="Delete"
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
        isLoading={deleteMutation.isPending}
      />

      <Dialog
        handle={editDialog}
        icon={BookOpen}
        title="Edit Offering"
        description="Update the details for this offering."
        content={(close) => (
          <EditOfferingForm catalogId={catalogId ?? ''} offering={offering} onSuccess={close} onCancel={close} />
        )}
      />
    </div>
  );
};
