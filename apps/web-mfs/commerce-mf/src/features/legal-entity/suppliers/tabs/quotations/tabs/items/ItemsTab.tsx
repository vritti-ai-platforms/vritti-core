import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import type { RowAction } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ListPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback } from 'react';
import { QuotationItemsTable } from '@/components/suppliers/tabs/quotations/QuotationItemsTable';
import type { QuotationSlotProps } from '@/components/suppliers/types';
import { SUPPLIER_QUOTATION_KEY, useRemoveSupplierQuotationItem } from '@/hooks/legal-entity/supplier-quotations';
import type { SupplierQuotationItemData } from '@/schemas/supplier-quotations';
import { QuotationItemDialog } from './forms/QuotationItemDialog';

const LOCKED_TIP = 'Lines are fixed once the quotation is posted to a site';

// The quotation's lines, editable while it is a draft
export const ItemsTab: React.FC<QuotationSlotProps> = ({ supplierId, quotation }) => {
  const currencyCode = quotation.currencyCode;
  const confirm = useConfirm();
  const addDialog = useDialog();
  const removeMutation = useRemoveSupplierQuotationItem(supplierId, quotation.id);
  const isDraft = quotation.status === 'DRAFT';

  const handleRemove = useCallback(
    async (item: SupplierQuotationItemData) => {
      const ok = await confirm({
        title: `Remove "${item.inventoryItemName}"?`,
        description: 'The line is removed from the quotation.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (ok) removeMutation.mutate(item.id);
    },
    [confirm, removeMutation],
  );

  const lineActions = useCallback(
    (item: SupplierQuotationItemData): RowAction[] => [
      {
        id: 'edit',
        icon: Pencil,
        label: 'Edit',
        permission: LE_SUPPLIERS.quotations.edit,
        disabled: !isDraft,
        disabledTip: LOCKED_TIP,
        dialog: {
          title: 'Edit Line',
          className: 'max-w-2xl',
          description: `Change the quoted terms for ${item.inventoryItemName}.`,
          content: (close) => (
            <QuotationItemDialog
              supplierId={supplierId}
              quotationId={quotation.id}
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
        permission: LE_SUPPLIERS.quotations.edit,
        disabled: !isDraft,
        disabledTip: LOCKED_TIP,
        onClick: () => handleRemove(item),
      },
    ],
    [supplierId, quotation.id, currencyCode, isDraft, handleRemove],
  );

  const addButton = (
    <Button
      size="sm"
      permission={LE_SUPPLIERS.quotations.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={addDialog.open}
      disabled={!isDraft}
      disabledTip={LOCKED_TIP}
    >
      Add Line
    </Button>
  );

  return (
    <>
      <QuotationItemsTable
        quotation={quotation}
        queryKey={SUPPLIER_QUOTATION_KEY(supplierId, quotation.id)}
        permission={LE_SUPPLIERS.quotations.view}
        mrpPermission={LE_INVENTORY_ITEMS.mrp.view}
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
            supplierId={supplierId}
            quotationId={quotation.id}
            currencyCode={currencyCode}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
