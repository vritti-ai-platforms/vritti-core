import { useQueryClient } from '@tanstack/react-query';
import { ORG_TAX_CLASSES } from '@vritti/commerce-permissions/tax-classes';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  DateCell,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { filter } from '@vritti/quantum-ui/filter';
import { useConfirm, useDialog, useOrgCountryCode } from '@vritti/quantum-ui/hooks';
import { ISOCountryFilter } from '@vritti/quantum-ui/selects/iso-country';
import { Pencil, Percent, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  TAX_CLASS_GROUPS_TABLE_KEY,
  useDeleteTaxClassGroupMapping,
  useTaxClassGroupsTable,
} from '@/hooks/organization/tax-classes';
import type { TaxClassData } from '@/schemas/tax-classes';
import type { TaxClassGroupData } from '@/schemas/tax-groups';
import { TaxClassGroupMappingDialog } from './forms/TaxClassGroupMappingDialog';

interface GroupsTabProps {
  taxClass: TaxClassData;
}

// The tax groups a class is taxed by in the chosen country over time, each for a period and optionally up to a unit price
export const GroupsTab = ({ taxClass }: GroupsTabProps) => {
  const queryClient = useQueryClient();
  const orgCountryCode = useOrgCountryCode();
  const taxClassGroupsTableQuery = useTaxClassGroupsTable(taxClass.id);
  const deleteMutation = useDeleteTaxClassGroupMapping();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (mapping: TaxClassGroupData) => {
      const ok = await confirm({
        title: `Unmap ${mapping.taxGroupName}?`,
        description: `${taxClass.name} will no longer be taxed by ${mapping.taxGroupName} in ${mapping.countryCode} for this period. Items of an unmapped class can't be taxed. This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (ok) deleteMutation.mutate({ taxClassId: taxClass.id, mappingId: mapping.id });
    },
    [confirm, deleteMutation, taxClass],
  );

  const columns = useMemo<ColumnDef<TaxClassGroupData>[]>(
    () => [
      { accessorKey: 'taxGroupName', header: 'Group', enableSorting: true },
      {
        accessorKey: 'taxGroupCode',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.taxGroupCode} mono />,
        enableSorting: true,
      },
      {
        accessorKey: 'maxUnitPrice',
        header: 'Max Unit Price',
        cell: ({ row }) =>
          row.original.maxUnitPrice ? <CurrencyCell value={row.original.maxUnitPrice} /> : 'Any price',
        enableSorting: false,
      },
      {
        accessorKey: 'validFrom',
        header: 'Valid From',
        cell: ({ row }) => <DateCell value={row.original.validFrom} />,
        enableSorting: true,
      },
      {
        accessorKey: 'validTo',
        header: 'Valid To',
        cell: ({ row }) => <DateCell value={row.original.validTo} />,
        enableSorting: true,
      },
      {
        accessorKey: 'isCurrent',
        header: '',
        cell: ({ row }) => (row.original.isCurrent ? <Badge variant="success">Current</Badge> : null),
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
              permission: ORG_TAX_CLASSES.groups.edit,
              dialog: {
                title: 'Edit Mapping',
                description: `Update when ${taxClass.name} is taxed by ${r.taxGroupName}.`,
                content: (close) => (
                  <TaxClassGroupMappingDialog
                    taxClassId={taxClass.id}
                    countryCode={r.countryCode}
                    mapping={r}
                    onSuccess={close}
                    onCancel={close}
                  />
                ),
              },
            },
            {
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              permission: ORG_TAX_CLASSES.groups.delete,
              onClick: () => handleDelete(r),
            },
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, taxClass],
  );

  const taxClassGroupsTable = useDataTable({
    columns,
    slug: 'commerce-org-tax-class-groups',
    label: 'tax group',
    query: taxClassGroupsTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: TAX_CLASS_GROUPS_TABLE_KEY(taxClass.id) }),
    defaultContext: [filter('country').equals(orgCountryCode)],
  });
  const { contextValue } = taxClassGroupsTable;
  const countryCode = contextValue('country') ?? orgCountryCode;

  return (
    <>
      <DataTable
        table={taxClassGroupsTable}
        mode="tab"
        permission={ORG_TAX_CLASSES.groups.view}
        contextBar={<ISOCountryFilter name="country" mode="context" />}
        searchConfig={{
          columns: [
            { id: 'taxGroupName', label: 'Group' },
            { id: 'taxGroupCode', label: 'Code' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_TAX_CLASSES.groups.add}
            >
              Map Group
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Percent,
          title: 'No tax groups',
          description: `Map the ${countryCode} tax group ${taxClass.name} is taxed by, and from when.`,
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_TAX_CLASSES.groups.add}
            >
              Map Group
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Percent}
        title="Map Tax Group"
        description={`Tax ${taxClass.name} by a ${countryCode} tax group for a period. Mappings with the same price limit can't overlap in time.`}
        content={(close) => (
          <TaxClassGroupMappingDialog
            taxClassId={taxClass.id}
            countryCode={countryCode}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
