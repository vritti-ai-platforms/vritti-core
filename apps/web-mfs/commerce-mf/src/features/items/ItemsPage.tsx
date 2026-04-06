import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { CategoryFilter } from '@vritti/quantum-ui/selects/category';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Package, Plus, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteItem } from '@/hooks/useDeleteItem';
import { ITEMS_TABLE_KEY, useItemsTable } from '@/hooks/useItemsTable';
import type { ItemData } from '@/schemas/items';
import { AddItemDialog } from './forms/AddItemDialog';

export const ItemsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: buId } = useSlugParams('buSlug');

  const { data: response, isLoading } = useItemsTable(buId || null);
  const deleteMutation = useDeleteItem();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const confirmed = await confirm({
        title: `Delete "${name}"?`,
        description: 'This item will be permanently removed. This action cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(id);
    },
    [confirm, deleteMutation],
  );

  const { table } = useDataTable({
    columns: getColumns({
      onView: (item) => navigate(buildSlug(item.name, item.id)),
      onDelete: handleDelete,
    }),
    slug: 'commerce-items',
    label: 'item',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: ITEMS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Items" description="Manage items for this business unit" />

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
            placeholder="All types"
            options={[
              { value: 'PRODUCT', label: 'Product' },
              { value: 'SERVICE', label: 'Service' },
            ]}
          />,
          <CategoryFilter key="categoryId" params={{ buId: buId ?? '' }} />,
        ]}
        toolbarActions={{
          actions: (
            <Button startAdornment={<Plus className="size-4" />} size="sm" onClick={addDialog.open}>
              Add Item
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Package,
          title: 'No items found',
          description: 'Add your first item to get started.',
          action: (
            <Button startAdornment={<Plus className="size-4" />} size="sm" onClick={addDialog.open}>
              Add Item
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="Add Item"
        description="Enter the details for the new item."
        content={(close) => <AddItemDialog businessUnitId={buId ?? ''} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};

interface ColumnActions {
  onView: (item: ItemData) => void;
  onDelete: (id: string, name: string) => Promise<void>;
}

function getColumns({ onView, onDelete }: ColumnActions): ColumnDef<ItemData, unknown>[] {
  return [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-[10px] font-medium">
          {row.original.code}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'categoryName',
      header: 'Category',
      cell: ({ row }) => row.original.categoryName ? <Badge variant="outline">{row.original.categoryName}</Badge> : <span className="text-muted-foreground">—</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const isProduct = row.original.type === 'PRODUCT';
        return (
          <Badge
            variant="secondary"
            className={isProduct ? 'bg-primary/10 text-primary' : 'bg-accent/50 text-accent-foreground'}
          >
            {isProduct ? 'Product' : 'Service'}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'basePrice',
      header: 'Base Price',
      cell: ({ row }) => {
        const num = Number.parseFloat(row.original.basePrice);
        return <span className="font-mono">{Number.isNaN(num) ? row.original.basePrice : num.toFixed(2)}</span>;
      },
      enableSorting: true,
    },
    {
      accessorKey: 'isAvailable',
      header: 'Status',
      cell: ({ row }) => {
        const { isAvailable } = row.original;
        return (
          <Badge
            variant={isAvailable ? 'secondary' : 'outline'}
            className={isAvailable ? 'bg-success/15 text-success' : ''}
          >
            {isAvailable ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
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
              onClick: () => onView(row.original),
            },
            {
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              onClick: () => onDelete(row.original.id, row.original.name),
            },
          ]}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
