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
import { useConfirm, useDialog, useOrgCountryCode } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { countryFlag, ISOCountryFilter } from '@vritti/quantum-ui/selects/iso-country';
import { Blocks, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  TAX_COMPONENTS_TABLE_KEY,
  useDeleteTaxComponent,
  useSetTaxComponentActive,
  useTaxComponentsTable,
} from '@/hooks/organization/tax-components';
import { AUTHORITY_LEVEL_LABELS, type TaxComponentData } from '@/schemas/tax-components';
import { AddTaxComponentDialog } from './forms/AddTaxComponentDialog';
import { EditTaxComponentDialog } from './forms/EditTaxComponentDialog';

export const TaxComponentsPage = () => {
  const queryClient = useQueryClient();
  const taxComponentsTableQuery = useTaxComponentsTable();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const deleteMutation = useDeleteTaxComponent();
  const setActiveMutation = useSetTaxComponentActive();

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
        accessorKey: 'countryCode',
        header: 'Country',
        cell: ({ row }) => `${countryFlag(row.original.countryCode)} ${row.original.countryCode}`,
        enableSorting: true,
      },
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
        enableSorting: true,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5">
            {row.original.name}
            {row.original.isSystem && <Badge variant="outline">System</Badge>}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'authorityLevel',
        header: 'Authority',
        cell: ({ row }) => <Badge variant="outline">{AUTHORITY_LEVEL_LABELS[row.original.authorityLevel]}</Badge>,
        enableSorting: true,
      },
      {
        accessorKey: 'standsInForName',
        header: 'Stands In For',
        cell: ({ row }) => row.original.standsInForName ?? '—',
        enableSorting: false,
      },
      {
        accessorKey: 'isRecoverable',
        header: 'Recoverable',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5">
            {row.original.isRecoverable ? (
              <Badge variant="success">Recoverable</Badge>
            ) : (
              <Badge variant="outline">Non-recoverable</Badge>
            )}
            {row.original.isWithholding && <Badge variant="outline">Withholding</Badge>}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <StatusSwitch
            checked={row.original.isActive}
            permission={ORG_TAX_COMPONENTS.toggle}
            disabled={row.original.isActive && !row.original.canDeactivate}
            disabledTip="Tax-group rates in force or still to come use this component. End those rates first."
            isLoading={setActiveMutation.isPending && setActiveMutation.variables?.id === row.original.id}
            onCheckedChange={(isActive) => setActiveMutation.mutate({ id: row.original.id, isActive })}
            ariaLabel={`Mark ${row.original.name} active`}
          />
        ),
        enableSorting: true,
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
                description: 'Update the tax component. Country and code are fixed.',
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
    [handleDelete, setActiveMutation],
  );

  const taxComponentsTable = useDataTable({
    columns,
    slug: 'commerce-org-tax-components',
    label: 'tax component',
    query: taxComponentsTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: TAX_COMPONENTS_TABLE_KEY }),
  });
  const { contextValue } = taxComponentsTable;
  const country = contextValue('country');
  const orgCountryCode = useOrgCountryCode();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tax Components"
        description="The atomic taxes of each country (CGST, VAT, excise…) that tax group rates are built from."
      />

      <DataTable
        table={taxComponentsTable}
        permission={ORG_TAX_COMPONENTS.view}
        contextBar={<ISOCountryFilter name="country" mode="context" placeholder="All countries" />}
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
          description: 'Add a tax component to start building tax group rates from atomic tax parts.',
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
        description="Create an atomic tax component of one country for building tax group rates."
        content={(close) => (
          <AddTaxComponentDialog countryCode={country ?? orgCountryCode} onSuccess={close} onCancel={close} />
        )}
      />
    </div>
  );
};
