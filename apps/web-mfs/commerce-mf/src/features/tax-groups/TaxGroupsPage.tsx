import { useQueryClient } from '@tanstack/react-query';
import { TAX_GROUPS } from '@vritti/commerce-permissions/tax-groups';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { Pencil, Percent, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { TAX_GROUPS_TABLE_KEY, useDeleteTaxGroup, useTaxGroupsTable } from '@/hooks/tax-groups';
import type { TaxGroupData } from '@/schemas/tax-groups';
import { AddTaxGroupDialog } from './forms/AddTaxGroupDialog';
import { EditTaxGroupDialog } from './forms/EditTaxGroupDialog';

export const TaxGroupsPage = () => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useTaxGroupsTable();
  const deleteMutation = useDeleteTaxGroup();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (group: TaxGroupData) => {
      const confirmed = await confirm({
        title: `Delete "${group.name}"?`,
        description: 'This tax group will be permanently removed.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) {
        deleteMutation.mutate(group.id);
      }
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<TaxGroupData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        enableSorting: true,
      },
      {
        id: 'rates',
        header: 'Tax Rates',
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-center gap-1">
            {row.original.taxRates.map((rate) => (
              <Badge key={rate.id} variant="outline" className="font-normal">
                {rate.name}: {rate.rate}%
              </Badge>
            ))}
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'totalRate',
        header: 'Total',
        accessorFn: (row) => row.taxRates.reduce((acc, rate) => acc + rate.rate, 0),
        cell: ({ row }) => {
          const total = row.original.taxRates.reduce((acc, rate) => acc + rate.rate, 0);
          return <span>{total.toFixed(2)}%</span>;
        },
        enableSorting: false,
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
        enableSorting: false,
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
                permission: TAX_GROUPS.edit,
                dialog: {
                  title: 'Edit Tax Group',
                  description: 'Update the rates and default behaviour for this tax group.',
                  content: (close) => <EditTaxGroupDialog group={row.original} onSuccess={close} onCancel={close} />,
                },
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                permission: TAX_GROUPS.delete,
                variant: 'destructive',
                disabled: deleteMutation.isPending || !row.original.canDelete,
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [deleteMutation.isPending, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-tax-groups',
    label: 'tax group',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: TAX_GROUPS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tax Groups" description="Manage reusable tax configurations for catalog items" />

      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [{ id: 'name', label: 'Name' }],
          searchAll: true,
        }}
        filters={[
          <SelectFilter
            key="isActive"
            name="isActive"
            label="Status"
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
          />,
        ]}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              onClick={addDialog.open}
              startAdornment={<Plus className="size-4" />}
              permission={TAX_GROUPS.add}
            >
              Add Tax Group
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Percent,
          title: 'No tax groups',
          description: 'Create your first tax group to assign tax structures to items.',
          action: (
            <Button onClick={addDialog.open} startAdornment={<Plus className="size-4" />} permission={TAX_GROUPS.add}>
              Add Tax Group
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Percent}
        title="Create Tax Group"
        description="Define a named group of one or more tax rates."
        content={(close) => <AddTaxGroupDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
