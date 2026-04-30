import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ArrowUpRight, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeletePriceList, usePriceListsTable } from '@/hooks/price-lists';
import type { PriceListData } from '@/schemas/price-lists';
import { getErrorMessage } from '@/utils/error';
import { PriceListForm } from './forms/PriceListForm';

export const PriceListsPage = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data: response, isLoading, error } = usePriceListsTable();
  const deleteMutation = useDeletePriceList();

  const addDialog = useDialog();
  const [editingPriceList, setEditingPriceList] = useState<PriceListData | null>(null);
  const editDialog = useDialog({ onClose: () => setEditingPriceList(null) });

  const handleEdit = useCallback(
    (priceList: PriceListData) => {
      setEditingPriceList(priceList);
      editDialog.open();
    },
    [editDialog],
  );

  const handleDelete = useCallback(
    async (priceList: PriceListData) => {
      const confirmed = await confirm({
        title: `Delete "${priceList.name}"?`,
        description: 'This price list and all its item and terminal assignments will be permanently removed.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });

      if (confirmed) {
        deleteMutation.mutate(priceList.id);
      }
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<PriceListData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(buildSlug(row.original.name, row.original.id))}
            className="group inline-flex items-center gap-1.5 px-0 h-auto text-left font-medium hover:bg-transparent hover:text-primary"
          >
            <span className="underline-offset-4 group-hover:underline">{row.original.name}</span>
            <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Code',
        enableSorting: true,
        cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">{row.original.code}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        enableSorting: true,
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge className="bg-success/15 text-success">Active</Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
          ),
      },
      {
        accessorKey: 'assignedItemsCount',
        header: 'Items',
        enableSorting: true,
        cell: ({ row }) => <span>{row.original.assignedItemsCount}</span>,
      },
      {
        accessorKey: 'assignedTerminalsCount',
        header: 'Terminals',
        enableSorting: true,
        cell: ({ row }) => <span>{row.original.assignedTerminalsCount}</span>,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'open',
                icon: ArrowUpRight,
                label: 'Open',
                onClick: () => navigate(buildSlug(row.original.name, row.original.id)),
              },
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit details',
                onClick: () => handleEdit(row.original),
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                variant: 'destructive',
                disabled: deleteMutation.isPending,
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [deleteMutation.isPending, handleDelete, handleEdit, navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-price-lists',
    label: 'price list',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Price Lists"
        description="Manage item prices for your POS terminals"
        actions={
          <Button onClick={addDialog.open} startAdornment={<Plus className="size-4" />}>
            New Price List
          </Button>
        }
      />

      {error ? <Alert variant="destructive" title="Failed to load" description={getErrorMessage(error)} /> : null}

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
        emptyStateConfig={{
          icon: Tags,
          title: 'No price lists yet',
          description: 'Create price lists to manage item prices across your POS terminals.',
          action: (
            <Button onClick={addDialog.open} startAdornment={<Plus className="size-4" />}>
              New Price List
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="New Price List"
        description="Create a price list to manage item prices for your POS terminals."
        className="max-w-lg"
        content={(close) => <PriceListForm onSuccess={close} onCancel={close} />}
      />

      {editingPriceList && (
        <Dialog
          handle={editDialog}
          title="Edit Price List"
          description="Update price list details."
          className="max-w-lg"
          content={(close) => <PriceListForm priceList={editingPriceList} onSuccess={close} onCancel={close} />}
        />
      )}
    </div>
  );
};
