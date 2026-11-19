import { useQueryClient } from '@tanstack/react-query';
import { type ColumnDef, DataTable, useDataTable } from '@vritti/quantum-ui/DataTable';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { Scale } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import {
  PurchaseActionValues,
  type PurchaseDetail,
  type PurchaseItemComparison,
  purchaseStatusConfig,
} from '@/schemas/purchases';
import { CategoryFilter } from '@/selectors/category';
import type { PurchasesBinding } from '../../bindings';
import { PurchaseCoverage } from '../../PurchaseCoverage';
import { coveragePercent } from '../../purchaseState';
import { PurchaseItemAllocations } from '../items/PurchaseItemAllocations';
import { PurchaseItemQuotes } from '../items/PurchaseItemQuotes';
import { usePurchaseItemBucketOptions } from '../items/usePurchaseItemBucketOptions';

interface PurchaseComparisonTabProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
}

// The purchase's items a page at a time with their quotes side by side per primary unit, the best highlighted, and
// the allocations sourcing them; a posted quote is taken as an allocation in one click
export const PurchaseComparisonTab: React.FC<PurchaseComparisonTabProps> = ({ binding, purchase }) => {
  const { permissions } = binding;
  const fmt = useFormatters();
  const queryClient = useQueryClient();
  const comparisonQuery = binding.usePurchaseItemComparison(purchase.id);
  const { data: actions } = binding.usePurchaseActions(purchase.id);
  const canAllocate = actions?.availableActions.includes(PurchaseActionValues.EDIT_ALLOCATIONS) ?? false;
  const closedTip = `The purchase is ${purchaseStatusConfig[purchase.status].label.toLowerCase()}.`;

  const bucketOptions = usePurchaseItemBucketOptions(binding, purchase.id);

  const columns = useMemo<ColumnDef<PurchaseItemComparison>[]>(
    () => [
      {
        id: 'inventoryItemName',
        header: 'Item',
        size: 240,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.item.inventoryItemName}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {fmt.quantity(row.original.item.display.primaryQty).primary}
            </span>
          </div>
        ),
      },
      {
        id: 'quotes',
        header: 'Quotes (per primary unit)',
        cell: ({ row }) => (
          <PurchaseItemQuotes
            binding={binding}
            purchase={purchase}
            quotes={row.original.quotes}
            canAllocate={canAllocate}
            allocateTip={closedTip}
          />
        ),
      },
      {
        id: 'allocations',
        header: 'Allocations',
        meta: { grow: true },
        cell: ({ row }) => (
          <PurchaseItemAllocations
            binding={binding}
            purchase={purchase}
            item={row.original.item}
            allocations={row.original.allocations}
            readOnly={!canAllocate}
          />
        ),
      },
      {
        id: 'coverage',
        header: 'Coverage',
        cell: ({ row }) => (
          <PurchaseCoverage
            percent={coveragePercent(row.original.item.allocatedPrimaryQty, row.original.item.primaryQty)}
            caption={`${fmt.quantity(row.original.item.display.allocatedPrimaryQty).primary} of ${fmt.quantity(row.original.item.display.primaryQty).primary} allocated`}
            align="center"
          />
        ),
      },
    ],
    [binding, purchase, fmt, canAllocate, closedTip],
  );

  const comparisonTable = useDataTable({
    columns,
    slug: binding.purchaseTableSlug(purchase.id, 'comparison'),
    label: 'item',
    query: comparisonQuery,
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.purchaseTableKeys.comparison(purchase.id) }),
  });

  return (
    <DataTable
      table={comparisonTable}
      mode="tab"
      permission={permissions.quotations.view}
      contextBar={<SelectFilter key="bucket" name="bucket" label="Progress" options={bucketOptions} mode="context" />}
      searchConfig={{
        columns: [
          { id: 'inventoryItemName', label: 'Item' },
          { id: 'inventoryItemCode', label: 'Code' },
        ],
        searchAll: true,
      }}
      filters={[<CategoryFilter key="categoryId" />, <binding.SupplierFilter key="supplierId" />]}
      emptyStateConfig={{
        icon: Scale,
        title: 'Nothing to compare',
        description: 'No item matches; quotes appear here once a requested quotation is posted.',
      }}
    />
  );
};
