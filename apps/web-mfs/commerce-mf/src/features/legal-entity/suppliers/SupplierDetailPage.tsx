import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { CalendarClock, Coins, Pencil, Truck } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuotationsTab } from '@/components/suppliers/tabs/quotations/QuotationsTab';
import { PeopleTab } from '@/features/organization/companies/tabs/people/PeopleTab';
import {
  useDeleteSupplier,
  useSetSupplierActive,
  useSetSupplierPaymentBlocked,
  useSetSupplierPurchasingBlocked,
  useSupplier,
} from '@/hooks/legal-entity/suppliers';
import { ChangeCurrencyDialog } from './forms/ChangeCurrencyDialog';
import { ChangeDefaultPaymentTermDialog } from './forms/ChangeDefaultPaymentTermDialog';
import { EditSupplierForm } from './forms/EditSupplierForm';
import { quotationsBinding } from './quotationsBinding';
import { EnrollmentsTab } from './tabs/enrollments/EnrollmentsTab';
import { ItemsTab } from './tabs/items/ItemsTab';
import { OverviewTab } from './tabs/OverviewTab';

export const SupplierDetailPage = () => {
  const { id } = useSlugParams('supplierSlug');
  const navigate = useNavigate();
  const { data: supplier } = useSupplier(id);
  const editDialog = useDialog();
  const changeCurrencyDialog = useDialog();
  const changeDefaultPaymentTermDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeleteSupplier();
  const setActiveMutation = useSetSupplierActive();
  const setPurchasingBlockedMutation = useSetSupplierPurchasingBlocked();
  const setPaymentBlockedMutation = useSetSupplierPaymentBlocked();

  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: `Delete "${supplier.partyName}"?`,
      description: 'This supplier and all its linked supplier items will be permanently removed.',
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
        titleSlot={
          <div className="flex flex-wrap items-center gap-2">
            <StatusSwitch
              size="md"
              checked={supplier.isActive}
              permission={LE_SUPPLIERS.toggle}
              isLoading={setActiveMutation.isPending}
              onCheckedChange={(isActive) => setActiveMutation.mutate({ id: supplier.id, isActive })}
              ariaLabel={`Mark ${supplier.partyName} active`}
            />
            <StatusSwitch
              size="md"
              tone="destructive"
              activeLabel="Purchasing Blocked"
              inactiveLabel="Purchasing Allowed"
              checked={supplier.purchasingBlocked}
              permission={LE_SUPPLIERS.purchasingBlock}
              isLoading={setPurchasingBlockedMutation.isPending}
              onCheckedChange={(purchasingBlocked) =>
                setPurchasingBlockedMutation.mutate({ id: supplier.id, purchasingBlocked })
              }
              ariaLabel={`Block purchasing from ${supplier.partyName}`}
            />
            <StatusSwitch
              size="md"
              tone="destructive"
              activeLabel="Payments Blocked"
              inactiveLabel="Payments Allowed"
              checked={supplier.paymentBlocked}
              permission={LE_SUPPLIERS.paymentBlock}
              isLoading={setPaymentBlockedMutation.isPending}
              onCheckedChange={(paymentBlocked) =>
                setPaymentBlockedMutation.mutate({ id: supplier.id, paymentBlocked })
              }
              ariaLabel={`Block payments to ${supplier.partyName}`}
            />
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              permission={LE_SUPPLIERS.currency.edit}
              startAdornment={<Coins className="size-4" />}
              onClick={changeCurrencyDialog.open}
            >
              Currencies
            </Button>
            <Button
              variant="outline"
              size="sm"
              permission={LE_SUPPLIERS.defaultPaymentTerm}
              startAdornment={<CalendarClock className="size-4" />}
              onClick={changeDefaultPaymentTermDialog.open}
            >
              Change Default Payment Term
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
        routeParam="tab"
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: LE_SUPPLIERS.view,
            content: <OverviewTab supplier={supplier} />,
          },
          {
            value: 'items',
            label: `Items (${supplier.itemCount})`,
            permission: LE_SUPPLIERS.items.view,
            content: <ItemsTab supplierId={supplier.id} />,
          },
          {
            value: 'enrollments',
            label: `Enrollments (${supplier.enrolledSiteCount})`,
            permission: LE_SUPPLIERS.sites.view,
            content: <EnrollmentsTab />,
          },
          {
            value: 'quotations',
            label: 'Quotations',
            permission: LE_SUPPLIERS.quotations.view,
            content: <QuotationsTab binding={quotationsBinding} supplierId={supplier.id} />,
          },
          ...(supplier.partyType === 'COMPANY'
            ? [
                {
                  value: 'persons',
                  label: 'Persons',
                  content: <PeopleTab companyId={supplier.partyId} />,
                },
              ]
            : []),
        ]}
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
        title="Supplier Currencies"
        description="Prices are never converted; a currency still used by the supplier's items, quotations or open purchase orders cannot be removed."
        content={(close) => (
          <ChangeCurrencyDialog
            supplierId={supplier.id}
            currencyCode={supplier.currencyCode}
            currencyCodes={supplier.currencyCodes}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      <Dialog
        handle={changeDefaultPaymentTermDialog}
        icon={CalendarClock}
        title="Change Default Payment Term"
        description="New site enrollments of this supplier start from it; existing enrollments keep their own."
        content={(close) => (
          <ChangeDefaultPaymentTermDialog
            supplierId={supplier.id}
            defaultPaymentTermId={supplier.defaultPaymentTermId}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      <DangerZone
        title="Delete this supplier"
        description="This action cannot be undone. The supplier and its linked supplier items will be permanently removed."
        buttonText="Delete Supplier"
        permission={LE_SUPPLIERS.delete}
        onClick={handleDelete}
        isLoading={deleteMutation.isPending}
        disabled={deleteMutation.isPending}
      />
    </div>
  );
};
