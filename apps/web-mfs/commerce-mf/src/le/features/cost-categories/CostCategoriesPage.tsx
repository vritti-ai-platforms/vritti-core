import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, type RowAction, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { CheckCircle2, Coins, Pencil, Plus, PowerOff, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  COST_CATEGORIES_TABLE_KEY,
  useActivateCostCategory,
  useCostCategoriesTable,
  useDeactivateCostCategory,
  useDeleteCostCategory,
} from '@/le/hooks/cost-categories';
import type { CostCategoryData } from '@/schemas/cost-categories';
import { AddCostCategoryDialog } from './forms/AddCostCategoryDialog';
import { EditCostCategoryDialog } from './forms/EditCostCategoryDialog';

export const CostCategoriesPage = () => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useCostCategoriesTable();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const deactivateMutation = useDeactivateCostCategory();
  const activateMutation = useActivateCostCategory();
  const deleteMutation = useDeleteCostCategory();

  const handleDeactivate = useCallback(
    async (row: CostCategoryData) => {
      const ok = await confirm({
        title: `Deactivate "${row.name}"?`,
        description:
          'Existing cost rows referencing this category stay intact. New cost association forms will hide it.',
        confirmLabel: 'Deactivate',
      });
      if (ok) deactivateMutation.mutate(row.id);
    },
    [confirm, deactivateMutation],
  );

  const handleActivate = useCallback((row: CostCategoryData) => activateMutation.mutate(row.id), [activateMutation]);

  const handleDelete = useCallback(
    async (row: CostCategoryData) => {
      const ok = await confirm({
        title: `Delete "${row.name}"?`,
        description: 'This permanently removes the category. Only allowed when no cost rows reference it.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (ok) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<CostCategoryData>[]>(
    () => [
      { accessorKey: 'code', header: 'Code', enableSorting: true },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'kind',
        header: 'Kind',
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.kind}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? 'secondary' : 'outline'}
            className={row.original.isActive ? 'bg-success/15 text-success' : ''}
          >
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'isSystem',
        header: '',
        cell: ({ row }) => (row.original.isSystem ? <Badge variant="outline">System</Badge> : null),
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const r = row.original;
          const actions: RowAction[] = [
            {
              id: 'edit',
              icon: Pencil,
              label: 'Edit',
              dialog: {
                title: 'Edit Cost Category',
                description: 'Rename the cost category. Code and kind are immutable for reporting consistency.',
                className: 'max-w-2xl',
                content: (close) => <EditCostCategoryDialog category={r} onSuccess={close} onCancel={close} />,
              },
            },
            r.isActive
              ? { id: 'deactivate', icon: PowerOff, label: 'Deactivate', onClick: () => handleDeactivate(r) }
              : { id: 'activate', icon: CheckCircle2, label: 'Activate', onClick: () => handleActivate(r) },
          ];
          if (r.canDelete) {
            actions.push({
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              onClick: () => handleDelete(r),
            });
          }
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleActivate, handleDeactivate, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-cost-categories',
    label: 'cost category',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: COST_CATEGORIES_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cost Categories"
        description="Configure the cost buckets used to attribute supplier price, freight, customs, etc. to received stock."
      />

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
              Add Cost Category
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Coins,
          title: 'No cost categories',
          description: 'Add a cost category to start attributing supplier price, freight, customs, etc.',
          action: (
            <Button onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Cost Category
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Coins}
        title="Add Cost Category"
        description="Create a new cost bucket for inventory cost attribution."
        content={(close) => <AddCostCategoryDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
