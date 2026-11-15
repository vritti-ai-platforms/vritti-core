import { Badge } from '@vritti/quantum-ui/Badge';
import { RowActions } from '@vritti/quantum-ui/DataTable';
import { useConfirm, useFormatters } from '@vritti/quantum-ui/hooks';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import type { PurchaseHeader, PurchaseSourcingAllocation, PurchaseSourcingItem } from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';
import { purchaseLegState } from '../../purchaseState';
import { EditAllocationDialog } from './forms/EditAllocationDialog';

interface SourcingAllocationsProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  item: PurchaseSourcingItem;
  readOnly: boolean;
}

const LOCKED_TIP = 'Locked — the supplier has left sourcing';

// An item's allocations: the supplier and its leg's state, the ordering unit and quantity, the price and the quotation
// it came from; editable while its supplier is in sourcing, and only a record once the view is read-only
export const SourcingAllocations: React.FC<SourcingAllocationsProps> = ({ binding, purchase, item, readOnly }) => {
  const fmt = useFormatters();
  const confirm = useConfirm();
  const removeMutation = binding.useRemoveAllocation();
  if (item.allocations.length === 0) {
    return (
      <Typography variant="caption" intent="muted" align="center">
        Not allocated
      </Typography>
    );
  }

  // Confirms and removes an allocation; the supplier's leg closes with its last one
  const handleRemove = async (allocation: PurchaseSourcingAllocation) => {
    const confirmed = await confirm({
      title: `Remove ${allocation.supplierName}'s allocation?`,
      description: `${item.inventoryItemName} is no longer sourced from ${allocation.supplierName} for this allocation.`,
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeMutation.mutate({ id: purchase.id, allocationId: allocation.id });
  };

  return (
    <div className="flex flex-col gap-2">
      {item.allocations.map((allocation) => (
        <div key={allocation.id} className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant={purchaseLegState({ step: allocation.legStep, status: allocation.legStatus }).variant}>
            {allocation.supplierName}
          </Badge>
          <span className="font-mono text-sm">
            {`${fmt.number(allocation.uomQty).primary} ${allocation.uomSymbol ?? ''} = ${fmt.number(allocation.primaryUomQty).primary} ${item.primaryUomSymbol ?? ''}`}
          </span>
          <span className="font-mono text-sm text-muted-foreground">
            {allocation.isPriced
              ? `${fmt.currency(allocation.unitPrice).primary} / ${allocation.uomSymbol ?? ''}`
              : 'Priced on the supplier invoice'}
          </span>
          {allocation.quotationNumber && <Badge variant="outline">{allocation.quotationNumber}</Badge>}
          {!readOnly && (
            <RowActions
              actions={[
                {
                  id: 'edit',
                  icon: Pencil,
                  label: 'Edit',
                  permission: binding.permissions.edit,
                  disabled: !allocation.isEditable,
                  disabledTip: LOCKED_TIP,
                  dialog: {
                    title: 'Edit Allocation',
                    description: `Change what ${allocation.supplierName} supplies of ${item.inventoryItemName}.`,
                    className: 'max-w-2xl',
                    content: (close) => (
                      <EditAllocationDialog
                        binding={binding}
                        purchase={purchase}
                        item={item}
                        allocation={allocation}
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
                  permission: binding.permissions.edit,
                  disabled: !allocation.isEditable,
                  disabledTip: LOCKED_TIP,
                  onClick: () => handleRemove(allocation),
                },
              ]}
            />
          )}
        </div>
      ))}
    </div>
  );
};
