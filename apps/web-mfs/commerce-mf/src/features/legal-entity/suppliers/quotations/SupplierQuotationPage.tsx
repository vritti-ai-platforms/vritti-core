import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { FileText, Pencil } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteSupplierQuotation, useSupplierQuotation } from '@/hooks/legal-entity/supplier-quotations';
import { useSupplier } from '@/hooks/legal-entity/suppliers';
import { SupplierQuotationDialog } from './forms/SupplierQuotationDialog';
import { QuotationStatusBadge } from './QuotationStatusBadge';
import { ItemsTab } from './tabs/ItemsTab';
import { OverviewTab } from './tabs/OverviewTab';
import { SitesTab } from './tabs/SitesTab';

// `…/suppliers/<supplier>/quotations/<number~id>` — a supplier's quotation: its lines and the sites it is posted to
export const SupplierQuotationPage = () => {
  const { id: supplierId } = useSlugParams('supplierSlug');
  const { id: quotationId } = useSlugParams('subDetail');
  const navigate = useNavigate();
  const { data: supplier } = useSupplier(supplierId);
  const { data: quotation } = useSupplierQuotation(supplierId, quotationId);
  const [activeTab, setActiveTab] = useState('overview');
  const editDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeleteSupplierQuotation(supplierId, {
    onSuccess: () => navigate('../../quotations', { relative: 'path' }),
  });

  const handleDelete = useCallback(async () => {
    const ok = await confirm({
      title: `Delete quotation "${quotation.quotationNumber}"?`,
      description:
        quotation.sites.length > 0
          ? `It is removed from ${pluralize('site', quotation.sites.length, true)} first: its prices there are deleted and the prices they replaced apply again.`
          : 'The draft and its lines are deleted.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (ok) deleteMutation.mutate(quotation.id);
  }, [confirm, deleteMutation, quotation]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={quotation.quotationNumber}
        titleSlot={<QuotationStatusBadge status={quotation.status} />}
        description={supplier.partyName}
        actions={
          <Button
            variant="outline"
            size="sm"
            permission={LE_SUPPLIERS.quotations.edit}
            startAdornment={<Pencil className="size-4" />}
            onClick={editDialog.open}
          >
            Edit
          </Button>
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: LE_SUPPLIERS.quotations.view,
            content: <OverviewTab quotation={quotation} supplierName={supplier.partyName} />,
          },
          {
            value: 'items',
            label: `Items (${quotation.items.length})`,
            permission: LE_SUPPLIERS.quotations.view,
            content: <ItemsTab supplierId={supplierId} currencyCode={quotation.currencyCode} quotation={quotation} />,
          },
          {
            value: 'sites',
            label: `Sites (${quotation.sites.length})`,
            permission: LE_SUPPLIERS.quotations.view,
            content: <SitesTab supplierId={supplierId} quotation={quotation} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <Dialog
        handle={editDialog}
        icon={FileText}
        title="Edit Quotation"
        description="Update the quotation's reference, date and note. Its validity is fixed once posted."
        content={(close) => (
          <SupplierQuotationDialog
            supplierId={supplierId}
            currencyCode={supplier.currencyCode}
            currencyCodes={supplier.currencyCodes}
            quotation={quotation}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      <DangerZone
        title="Delete this quotation"
        description="Removes it from every site it is posted to — deleting its prices there — and then deletes it."
        buttonText="Delete Quotation"
        permission={LE_SUPPLIERS.quotations.delete}
        onClick={handleDelete}
        isLoading={deleteMutation.isPending}
        disabled={deleteMutation.isPending}
      />
    </div>
  );
};
