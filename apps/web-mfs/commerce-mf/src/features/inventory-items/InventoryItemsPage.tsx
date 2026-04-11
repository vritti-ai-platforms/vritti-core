import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, Package, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ITEMS_TABLE_KEY, useDeleteInventoryItem, useInventoryItemsTable } from '@/hooks/inventory-items';
import type { InventoryItemData } from '@/schemas/inventory-items';
import { AddInventoryItemDialog } from './forms/AddInventoryItemDialog';

export const InventoryItemsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useInventoryItemsTable();
  const deleteMutation = useDeleteInventoryItem();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const confirmed = await confirm({
        title: `Delete "${name}"?`,
        description: 'This inventory item and all its stock levels and ledger entries will be permanently removed.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<InventoryItemData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        enableSorting: true,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const isMaterial = row.original.type === 'MATERIAL';
          return (
            <Badge variant={isMaterial ? 'secondary' : 'outline'}>
              {isMaterial ? 'Material' : 'Product'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'uomSymbol',
        header: 'Unit',
        cell: ({ row }) => row.original.uomSymbol ?? '—',
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'view',
                icon: Eye,
                label: 'View',
                onClick: () => navigate(buildSlug(row.original.name, row.original.id)),
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                variant: 'destructive',
                onClick: () => handleDelete(row.original.id, row.original.name),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-inventory-items',
    label: 'inventory item',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: INVENTORY_ITEMS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inventory Items" description="Manage raw materials and finished products" />

      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'name', label: 'Name' },
            { id: 'code', label: 'Code' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Item
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Package,
          title: 'No inventory items',
          description: 'Add your first inventory item to start tracking stock.',
          action: (
            <Button onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Item
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="Add Inventory Item"
        description="Create a new material or product to track in inventory."
        content={(close) => <AddInventoryItemDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
