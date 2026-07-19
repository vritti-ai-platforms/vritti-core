import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil, Truck } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteSupplier, useUnenrollSiteSupplier } from '@/hooks/site/suppliers';
import { EditEnrollmentDialog } from './forms/EditEnrollmentDialog';
import { ItemsTab } from './tabs/ItemsTab';
import { OverviewTab } from './tabs/OverviewTab';

export const SupplierDetailPage = () => {
  const { id } = useSlugParams('supplierSlug');
  const navigate = useNavigate();
  const { data: supplier } = useSiteSupplier(id);
  const [activeTab, setActiveTab] = useState('overview');
  const editDialog = useDialog();
  const confirm = useConfirm();
  const unenrollMutation = useUnenrollSiteSupplier();

  const handleUnenroll = useCallback(async () => {
    const confirmed = await confirm({
      title: `Unenroll "${supplier.partyName}"?`,
      description: 'This site will no longer be able to purchase from this supplier.',
      confirmLabel: 'Unenroll',
      variant: 'destructive',
    });
    if (confirmed) unenrollMutation.mutate(supplier.id, { onSuccess: () => navigate('..') });
  }, [supplier, confirm, unenrollMutation, navigate]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={supplier.partyName}
        description={supplier.code}
        actions={
          <Button
            variant="outline"
            size="sm"
            permission={SITE_SUPPLIERS.edit}
            startAdornment={<Pencil className="size-4" />}
            onClick={editDialog.open}
          >
            Edit Enrollment
          </Button>
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: SITE_SUPPLIERS.view,
            content: <OverviewTab supplier={supplier} />,
          },
          {
            value: 'items',
            label: 'Items',
            permission: SITE_SUPPLIERS.items.view,
            content: <ItemsTab supplierId={supplier.id} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <Dialog
        handle={editDialog}
        icon={Truck}
        title="Edit Enrollment"
        description="Update this site's origin registration and branch bank picks."
        content={(close) => <EditEnrollmentDialog supplier={supplier} onSuccess={close} onCancel={close} />}
      />

      <DangerZone
        title="Unenroll this supplier"
        description="This site will no longer be able to purchase from this supplier."
        buttonText="Unenroll Supplier"
        permission={SITE_SUPPLIERS.delete}
        onClick={handleUnenroll}
        isLoading={unenrollMutation.isPending}
        disabled={unenrollMutation.isPending}
      />
    </div>
  );
};
