import { useQueryClient } from '@tanstack/react-query';
import { ORG_TAX_COMPONENTS } from '@vritti/commerce-permissions/tax-components';
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
import { Blocks, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  TAX_COMPONENTS_TABLE_KEY,
  useDeleteTaxComponent,
  useTaxComponentsTable,
} from '@/hooks/organization/tax-components';
import { AUTHORITY_LEVEL_LABELS, type TaxComponentData } from '@/schemas/tax-components';
import { AddTaxComponentDialog } from './forms/AddTaxComponentDialog';
import { EditTaxComponentDialog } from './forms/EditTaxComponentDialog';

export const TaxComponentsPage = () => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useTaxComponentsTable();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const deleteMutation = useDeleteTaxComponent();

  const handleDelete = useCallback(
    async (row: TaxComponentData) => {
      const ok = await confirm({
        title: `Delete "${row.name}"?`,
        description: 'This permanently removes the tax component. Only allowed when nothing references it.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (ok) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<TaxComponentData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
        enableSorting: true,
      },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'authorityLevel',
        header: 'Authority',
        cell: ({ row }) => <Badge variant="outline">{AUTHORITY_LEVEL_LABELS[row.original.authorityLevel]}</Badge>,
        enableSorting: true,
      },
      {
        accessorKey: 'isRecoverable',
        header: 'Recoverable',
        cell: ({ row }) => (
          <Badge
            variant={row.original.isRecoverable ? 'secondary' : 'outline'}
            className={row.original.isRecoverable ? 'bg-success/15 text-success' : ''}
          >
            {row.original.isRecoverable ? 'Recoverable' : 'Non-recoverable'}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'isWithholding',
        header: '',
        cell: ({ row }) => (row.original.isWithholding ? <Badge variant="outline">Withholding</Badge> : null),
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
              permission: ORG_TAX_COMPONENTS.edit,
              dialog: {
                title: 'Edit Tax Component',
                description: 'Update the tax component or toggle its status. Code is immutable.',
                content: (close) => <EditTaxComponentDialog taxComponent={r} onSuccess={close} onCancel={close} />,
              },
            },
            {
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              permission: ORG_TAX_COMPONENTS.delete,
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
    slug: 'commerce-org-tax-components',
    label: 'tax component',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: TAX_COMPONENTS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tax Components"
        description="Define the atomic tax parts (CGST, VAT, excise…) that rate bundles are built from."
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_TAX_COMPONENTS.view}
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
              permission={ORG_TAX_COMPONENTS.add}
            >
              Add Tax Component
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Blocks,
          title: 'No tax components',
          description: 'Add a tax component to start building rate bundles from atomic tax parts.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_TAX_COMPONENTS.add}
            >
              Add Tax Component
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Blocks}
        title="Add Tax Component"
        description="Create a new atomic tax component for building rate bundles."
        content={(close) => <AddTaxComponentDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
