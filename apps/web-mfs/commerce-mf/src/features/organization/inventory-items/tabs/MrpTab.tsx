import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  DateTimeCell,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { Pencil, Plus, Tag } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useInventoryItemMrp } from '@/hooks/organization/inventory-items';
import type { InventoryItemMrpData } from '@/schemas/inventory-item-mrp';
import { UpsertMrpForm } from '../forms/UpsertMrpForm';

interface MrpTabProps {
  inventoryItemId: string;
}

export const MrpTab: React.FC<MrpTabProps> = ({ inventoryItemId }) => {
  const addDialog = useDialog();
  const { data: rows = [], isLoading } = useInventoryItemMrp(inventoryItemId);

  const columns = useMemo<ColumnDef<InventoryItemMrpData>[]>(
    () => [
      {
        accessorKey: 'uomSymbol',
        header: 'Unit',
        cell: ({ row }) => row.original.uomSymbol ?? '—',
      },
      {
        accessorKey: 'amount',
        header: 'Currency',
        cell: ({ row }) => row.original.amount.currency,
      },
      {
        id: 'value',
        header: 'MRP',
        cell: ({ row }) => <CurrencyCell value={row.original.amount} />,
      },
      {
        accessorKey: 'sourcedAt',
        header: 'Sourced',
        cell: ({ row }) =>
          row.original.sourcedAt ? (
            <DateTimeCell value={row.original.sourcedAt} />
          ) : (
            <span className="text-xs text-muted-foreground">Manual</span>
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                dialog: {
                  title: 'Edit MRP',
                  description: `Update the ${row.original.amount.currency} MRP for this item.`,
                  content: (close) => (
                    <UpsertMrpForm
                      inventoryItemId={inventoryItemId}
                      currentUomId={row.original.uomId}
                      currentAmount={row.original.amount}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [inventoryItemId],
  );

  const serverState = useMemo(() => ({ result: rows, count: rows.length }), [rows]);

  const { table } = useDataTable({
    columns,
    serverState,
    slug: `org-inventory-item-${inventoryItemId}-mrp`,
    label: 'MRP',
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Set MRP
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Tag,
          title: 'No MRP set',
          description: 'Set a maximum retail price per currency for this item.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Set MRP
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Tag}
        title="Set MRP"
        description="Set the maximum retail price for this item."
        content={(close) => <UpsertMrpForm inventoryItemId={inventoryItemId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
