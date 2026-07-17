import { useQueryClient } from '@tanstack/react-query';
import { ORG_TAX_CLASSES } from '@vritti/commerce-permissions/tax-classes';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { TAX_CLASSES_TABLE_KEY, useDeleteTaxClass, useTaxClassesTable } from '@/hooks/organization/tax-classes';
import type { TaxClassData } from '@/schemas/tax-classes';
import { AddTaxClassDialog } from './forms/AddTaxClassDialog';
import { EditTaxClassDialog } from './forms/EditTaxClassDialog';

export const TaxClassesPage = () => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useTaxClassesTable();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const deleteMutation = useDeleteTaxClass();

  const handleDelete = useCallback(
    async (row: TaxClassData) => {
      const ok = await confirm({
        title: `Delete "${row.name}"?`,
        description: 'This permanently removes the tax class. Only allowed when nothing references it.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (ok) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<TaxClassData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
        enableSorting: true,
      },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
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
              permission: ORG_TAX_CLASSES.edit,
              dialog: {
                title: 'Edit Tax Class',
                description: 'Rename the tax class or toggle its status. Code is immutable.',
                content: (close) => <EditTaxClassDialog taxClass={r} onSuccess={close} onCancel={close} />,
              },
            },
            {
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              permission: ORG_TAX_CLASSES.delete,
              disabled: !r.canDelete,
              onClick: () => handleDelete(r),
            },
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-org-tax-classes',
    label: 'tax class',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: TAX_CLASSES_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tax Classes"
        description="Group products by tax treatment to drive rate resolution across your catalog."
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_TAX_CLASSES.view}
        searchConfig={{
          columns: [
            { id: 'name', label: 'Name' },
            { id: 'code', label: 'Code' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_TAX_CLASSES.add}
            >
              Add Tax Class
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Tags,
          title: 'No tax classes',
          description: 'Add a tax class to start grouping products by tax treatment.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_TAX_CLASSES.add}
            >
              Add Tax Class
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Tags}
        title="Add Tax Class"
        description="Create a new tax class for grouping products by tax treatment."
        content={(close) => <AddTaxClassDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
