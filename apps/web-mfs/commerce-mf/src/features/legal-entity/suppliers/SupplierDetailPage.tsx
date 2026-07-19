import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil, RefreshCw, Truck } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteSupplier, useSupplier, useSupplierInventoryItemIds } from '@/hooks/legal-entity/suppliers';
import { ChangeCurrencyDialog } from './forms/ChangeCurrencyDialog';
import { EditSupplierForm } from './forms/EditSupplierForm';
import { ContactsTab } from './tabs/ContactsTab';
import { ItemsTab } from './tabs/ItemsTab';
import { OverviewTab } from './tabs/OverviewTab';
import { SitesTab } from './tabs/SitesTab';

export const SupplierDetailPage = () => {
  const { id } = useSlugParams('supplierSlug');
  const navigate = useNavigate();
  const { data: supplier } = useSupplier(id);
  const { data: supplierInventoryItemIds = [] } = useSupplierInventoryItemIds(supplier.id);
  const [activeTab, setActiveTab] = useState('overview');
  const editDialog = useDialog();
  const changeCurrencyDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeleteSupplier();

  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: `Delete "${supplier.partyName}"?`,
      description: 'This supplier and all linked supplier items and contacts will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(supplier.id, { onSuccess: () => navigate('..') });
    }
  }, [supplier, confirm, deleteMutation, navigate]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={supplier.partyName}
        description={supplier.code}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              permission={LE_SUPPLIERS.edit}
              startAdornment={<RefreshCw className="size-4" />}
              onClick={changeCurrencyDialog.open}
            >
              Change Currency
            </Button>
            <Button
              variant="outline"
              size="sm"
              permission={LE_SUPPLIERS.edit}
              startAdornment={<Pencil className="size-4" />}
              onClick={editDialog.open}
            >
              Edit
            </Button>
          </div>
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: LE_SUPPLIERS.view,
            content: <OverviewTab supplier={supplier} />,
          },
          {
            value: 'items',
            label: `Items (${supplierInventoryItemIds.length})`,
            permission: LE_SUPPLIERS.items.view,
            content: <ItemsTab supplierId={supplier.id} supplierCurrencyCode={supplier.currencyCode} />,
          },
          {
            value: 'sites',
            label: `Sites (${supplier.enrolledSiteCount})`,
            permission: LE_SUPPLIERS.sites.view,
            content: <SitesTab supplierId={supplier.id} partyId={supplier.partyId} />,
          },
          {
            value: 'contacts',
            label: 'Contacts',
            permission: LE_SUPPLIERS.view,
            content: <ContactsTab supplierId={supplier.id} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <Dialog
        handle={editDialog}
        icon={Truck}
        title="Edit Supplier"
        description="Update the supplier details."
        className="max-w-3xl"
        content={(close) => <EditSupplierForm supplier={supplier} onSuccess={close} onCancel={close} />}
      />

      <Dialog
        handle={changeCurrencyDialog}
        icon={Truck}
        title="Change Supplier Currency"
        description="Reprices all catalog items using the provided conversion rate."
        content={(close) => (
          <ChangeCurrencyDialog
            supplierId={supplier.id}
            currentCurrencyCode={supplier.currencyCode}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      <DangerZone
        title="Delete this supplier"
        description="This action cannot be undone. The supplier and its linked supplier items and contacts will be permanently removed."
        buttonText="Delete Supplier"
        permission={LE_SUPPLIERS.delete}
        onClick={handleDelete}
        isLoading={deleteMutation.isPending}
        disabled={deleteMutation.isPending}
      />
    </div>
  );
};
