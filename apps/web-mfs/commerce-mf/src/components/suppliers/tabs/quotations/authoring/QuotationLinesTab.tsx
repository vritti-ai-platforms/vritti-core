import { Button } from '@vritti/quantum-ui/Button';
import type { RowAction } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { ListPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback } from 'react';
import type { QuotationSlotProps } from '@/components/suppliers/bindings';
import type { SupplierQuotationItemData } from '@/schemas/supplier-quotations';
import { QuotationItemsTable } from '../QuotationItemsTable';
import { QuotationItemDialog } from './forms/QuotationItemDialog';

// The quotation's lines, editable while it is a draft its workspace writes
export const QuotationLinesTab: React.FC<QuotationSlotProps> = ({ binding, authoring, supplierId, quotation }) => {
  const currencyCode = quotation.currencyCode;
  // A quotation a site owns follows that site's purchasing rules
  const ownerSiteId = quotation.ownerScope === 'SITE' ? quotation.siteId : null;
  const addDialog = useDialog();
  const removeMutation = authoring.useRemoveItem(supplierId, quotation.id);
  const isLocked = !quotation.canWrite || quotation.status !== 'DRAFT';
  const lockedTip = quotation.canWrite
    ? 'Lines are fixed once the quotation is posted to a site'
    : `Owned by ${quotation.ownerName}`;

  const lineActions = useCallback(
    (item: SupplierQuotationItemData): RowAction[] => [
      {
        id: 'edit',
        icon: Pencil,
        label: 'Edit',
        permission: authoring.permissions.edit,
        disabled: isLocked,
        disabledTip: lockedTip,
        dialog: {
          title: 'Edit Line',
          className: 'max-w-2xl',
          description: `Change the quoted terms for ${item.inventoryItemName}.`,
          content: (close) => (
            <QuotationItemDialog
              authoring={authoring}
              supplierId={supplierId}
              quotationId={quotation.id}
              siteId={ownerSiteId}
              currencyCode={currencyCode}
              item={item}
              onSuccess={close}
              onCancel={close}
            />
          ),
        },
      },
      {
        id: 'remove',
        icon: Trash2,
        label: 'Remove',
        variant: 'destructive',
        permission: authoring.permissions.edit,
        disabled: isLocked,
        disabledTip: lockedTip,
        confirm: {
          title: `Remove "${item.inventoryItemName}"?`,
          description: 'The line is removed from the quotation.',
          confirmLabel: 'Remove',
          variant: 'destructive',
        },
        onClick: () => removeMutation.mutate(item.id),
      },
    ],
    [authoring, supplierId, quotation.id, currencyCode, isLocked, lockedTip, ownerSiteId, removeMutation.mutate],
  );

  const addButton = (
    <Button
      size="sm"
      permission={authoring.permissions.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={addDialog.open}
      disabled={isLocked}
      disabledTip={lockedTip}
    >
      Add Line
    </Button>
  );

  return (
    <>
      <QuotationItemsTable
        quotation={quotation}
        queryKey={binding.quotationKey(supplierId, quotation.id)}
        permission={binding.permissions.view}
        mrpPermission={binding.permissions.mrpView}
        lineActions={lineActions}
        toolbarAction={addButton}
        emptyDescription="Add a line for each item the supplier quoted, with its price, MRP and scheme."
      />
      <Dialog
        handle={addDialog}
        icon={ListPlus}
        title="Add Line"
        className="max-w-2xl"
        description="Quote one of the supplier's items."
        content={(close) => (
          <QuotationItemDialog
            authoring={authoring}
            supplierId={supplierId}
            quotationId={quotation.id}
            siteId={ownerSiteId}
            currencyCode={currencyCode}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
