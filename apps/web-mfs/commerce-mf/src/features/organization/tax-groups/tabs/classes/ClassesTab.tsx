import { useQueryClient } from '@tanstack/react-query';
import { ORG_TAX_GROUPS } from '@vritti/commerce-permissions/tax-groups';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  DateCell,
  type RowAction,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  TAX_GROUP_CLASSES_TABLE_KEY,
  useDeleteTaxClassGroup,
  useTaxGroupClassesTable,
} from '@/hooks/organization/tax-groups';
import type { TaxClassGroupData, TaxGroupData } from '@/schemas/tax-groups';
import { TaxClassGroupDialog } from './forms/TaxClassGroupDialog';

interface ClassesTabProps {
  taxGroup: TaxGroupData;
}

// The tax classes taxed by this group in its country, each for a period and optionally up to a unit price
export const ClassesTab = ({ taxGroup }: ClassesTabProps) => {
  const queryClient = useQueryClient();
  const taxGroupClassesTableQuery = useTaxGroupClassesTable(taxGroup.id);
  const deleteMutation = useDeleteTaxClassGroup();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (mapping: TaxClassGroupData) => {
      const ok = await confirm({
        title: `Unmap ${mapping.taxClassName}?`,
        description: `${mapping.taxClassName} will no longer be taxed by ${taxGroup.name} in ${taxGroup.countryCode}. Items of an unmapped class can't be taxed. This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (ok) deleteMutation.mutate({ taxGroupId: taxGroup.id, mappingId: mapping.id });
    },
    [confirm, deleteMutation, taxGroup],
  );

  const columns = useMemo<ColumnDef<TaxClassGroupData>[]>(
    () => [
      { accessorKey: 'taxClassName', header: 'Class', enableSorting: true },
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
              permission: ORG_TAX_GROUPS.classes.edit,
              dialog: {
                title: 'Edit Mapping',
                description: `Update when ${r.taxClassName} is taxed by ${taxGroup.name}.`,
                content: (close) => (
                  <TaxClassGroupDialog
                    countryCode={taxGroup.countryCode}
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
              permission: ORG_TAX_GROUPS.classes.delete,
              onClick: () => handleDelete(r),
            },
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, taxGroup],
  );

  const taxGroupClassesTable = useDataTable({
    columns,
    slug: 'commerce-org-tax-group-classes',
    label: 'tax class',
    query: taxGroupClassesTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: TAX_GROUP_CLASSES_TABLE_KEY(taxGroup.id) }),
  });

  return (
    <>
      <DataTable
        table={taxGroupClassesTable}
        mode="tab"
        permission={ORG_TAX_GROUPS.classes.view}
        searchConfig={{
          columns: [{ id: 'taxClassName', label: 'Class' }],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_TAX_GROUPS.classes.add}
            >
              Map Class
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Tags,
          title: 'No tax classes',
          description: `Map the tax classes ${taxGroup.name} applies to in ${taxGroup.countryCode}, e.g. Medicines.`,
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_TAX_GROUPS.classes.add}
            >
              Map Class
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Tags}
        title="Map Tax Class"
        description={`Tax a class by ${taxGroup.name} in ${taxGroup.countryCode} for a period. Mappings of one class with the same price limit can't overlap in time.`}
        content={(close) => (
          <TaxClassGroupDialog
            countryCode={taxGroup.countryCode}
            taxGroupId={taxGroup.id}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
