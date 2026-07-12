import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { CategoryFilter } from '@vritti/quantum-ui/selects/category';
import { UomFilter } from '@vritti/quantum-ui/selects/uom';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Package, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InventoryItemData } from '@/schemas/inventory-items';
import { inventoryItemTypeConfig, inventoryTrackingConfig } from '@/schemas/inventory-items';
import { INVENTORY_ITEMS_TABLE_KEY, useInventoryItemsTable } from '@/hooks/site/inventory-items';
import { AddInventoryItemDialog } from './forms/AddInventoryItemDialog';

export const InventoryItemsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useInventoryItemsTable();
  const addDialog = useDialog();

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
        accessorKey: 'categoryName',
        header: 'Category',
        cell: ({ row }) => <StringCell value={row.original.categoryName} />,
        enableSorting: false,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const config = inventoryItemTypeConfig[row.original.type];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'tracking',
        header: 'Tracking',
        enableSorting: true,
        cell: ({ row }) => inventoryTrackingConfig[row.original.tracking].label,
      },
      {
        accessorKey: 'uomSymbol',
        header: 'Unit',
        cell: ({ row }) => <StringCell value={row.original.uomSymbol} />,
        enableSorting: false,
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
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate],
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
        filters={[
          <SelectFilter
            key="type"
            name="type"
            label="Type"
            multiple
            options={Object.entries(inventoryItemTypeConfig).map(([value, { label }]) => ({ label, value }))}
          />,
          <SelectFilter
            key="tracking"
            name="tracking"
            label="Tracking"
            multiple
            options={Object.entries(inventoryTrackingConfig).map(([value, { label }]) => ({ label, value }))}
          />,
          <CategoryFilter key="categoryId" multiple />,
          <UomFilter key="uomId" multiple />,
        ]}
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
        icon={Package}
        title="Add Inventory Item"
        className="max-w-4xl"
        description="Create a new material or product to track in inventory."
        content={(close) => <AddInventoryItemDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
