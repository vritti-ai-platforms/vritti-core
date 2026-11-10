import { useQueryClient } from '@tanstack/react-query';
import { ORG_TAX_GROUPS } from '@vritti/commerce-permissions/tax-groups';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateCell,
  NumberCell,
  type RowAction,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { DateFilter } from '@vritti/quantum-ui/DateFilter';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { ValueFilter } from '@vritti/quantum-ui/ValueFilter';
import { Pencil, Percent, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  TAX_GROUP_RATES_TABLE_KEY,
  useDeleteTaxGroupRate,
  useTaxGroupRatesTable,
} from '@/hooks/organization/tax-groups';
import {
  NO_JURISDICTION_CHECK_LABEL,
  TAX_BASE_LABELS,
  TAX_JURISDICTION_CHECK_LABELS,
  TAX_JURISDICTION_CHECK_OPTIONS,
  TAX_MEASURE_LABELS,
  type TaxGroupData,
  type TaxGroupRateData,
} from '@/schemas/tax-groups';
import { JurisdictionFilter } from '@/selectors/jurisdiction';
import { TaxGroupRateDialog } from './forms/TaxGroupRateDialog';

interface RatesTabProps {
  taxGroup: TaxGroupData;
}

// The group's dated rates per component, state and jurisdiction check; a state and a day picked in the context bar narrow them
// to the rates charged there on that day
export const RatesTab = ({ taxGroup }: RatesTabProps) => {
  const queryClient = useQueryClient();
  const fmt = useFormatters();
  const [jurisdiction, setJurisdiction] = useState<string>();
  const [asOf, setAsOf] = useState<string>();
  const taxGroupRatesTableQuery = useTaxGroupRatesTable(taxGroup.id, { jurisdiction, asOf });
  const deleteMutation = useDeleteTaxGroupRate();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (rate: TaxGroupRateData) => {
      const ok = await confirm({
        title: `Delete the ${rate.taxComponentName} rate?`,
        description: `The ${rate.taxComponentName} rate of ${taxGroup.name} in ${rate.jurisdictionName ?? 'the whole country'} will be permanently removed. This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (ok) deleteMutation.mutate({ taxGroupId: taxGroup.id, rateId: rate.id });
    },
    [confirm, deleteMutation, taxGroup],
  );

  const columns = useMemo<ColumnDef<TaxGroupRateData>[]>(
    () => [
      { accessorKey: 'taxComponentName', header: 'Component', enableSorting: true },
      {
        accessorKey: 'jurisdictionName',
        header: 'State',
        cell: ({ row }) => row.original.jurisdictionName ?? 'Whole country',
        enableSorting: true,
      },
      {
        accessorKey: 'jurisdictionCheck',
        header: 'Jurisdiction Check',
        cell: ({ row }) => {
          const { jurisdictionCheck } = row.original;
          return jurisdictionCheck ? TAX_JURISDICTION_CHECK_LABELS[jurisdictionCheck] : NO_JURISDICTION_CHECK_LABEL;
        },
        enableSorting: true,
      },
      {
        id: 'rate',
        header: 'Rate',
        cell: ({ row }) => {
          const { rate, amount, measure } = row.original;
          return (
            <span className="font-mono">
              {amount && measure
                ? `${fmt.currency(amount).primary} ${TAX_MEASURE_LABELS[measure].toLowerCase()}`
                : `${fmt.number(rate).primary}%`}
            </span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'base',
        header: 'Base',
        cell: ({ row }) => TAX_BASE_LABELS[row.original.base],
        enableSorting: true,
      },
      {
        accessorKey: 'sequence',
        header: 'Sequence',
        cell: ({ row }) => <NumberCell value={row.original.sequence} />,
        enableSorting: true,
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
              permission: ORG_TAX_GROUPS.rates.edit,
              dialog: {
                title: 'Edit Rate',
                description: `Update the ${r.taxComponentName} rate of ${taxGroup.name}.`,
                content: (close) => (
                  <TaxGroupRateDialog taxGroup={taxGroup} rate={r} onSuccess={close} onCancel={close} />
                ),
              },
            },
            {
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              permission: ORG_TAX_GROUPS.rates.delete,
              onClick: () => handleDelete(r),
            },
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [fmt, handleDelete, taxGroup],
  );

  const taxGroupRatesTable = useDataTable({
    columns,
    slug: 'commerce-org-tax-group-rates',
    label: 'rate',
    query: taxGroupRatesTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: TAX_GROUP_RATES_TABLE_KEY(taxGroup.id) }),
  });

  return (
    <>
      <DataTable
        table={taxGroupRatesTable}
        mode="tab"
        permission={ORG_TAX_GROUPS.rates.view}
        contextBar={
          <>
            <JurisdictionFilter
              country={taxGroup.countryCode}
              placeholder="All states"
              mode="context"
              value={jurisdiction}
              onChange={(result) => setJurisdiction(result?.value == null ? undefined : String(result.value))}
            />
            <DateFilter
              name="asOf"
              label="As of"
              mode="context"
              value={asOf ? { field: 'asOf', operator: 'equals', value: asOf } : null}
              onChange={(condition) => setAsOf(condition?.value)}
            />
          </>
        }
        filters={[
          <SelectFilter
            key="jurisdictionCheck"
            name="jurisdictionCheck"
            label="Jurisdiction Check"
            options={TAX_JURISDICTION_CHECK_OPTIONS}
            multiple
          />,
          <ValueFilter key="rate" name="rate" label="Rate (%)" fieldType="number" />,
        ]}
        searchConfig={{
          columns: [
            { id: 'taxComponentName', label: 'Component' },
            { id: 'jurisdictionName', label: 'State' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_TAX_GROUPS.rates.add}
            >
              Add Rate
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Percent,
          title: 'No rates',
          description: `Add the rates ${taxGroup.name} charges, e.g. CGST and SGST within a state and IGST across states.`,
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_TAX_GROUPS.rates.add}
            >
              Add Rate
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Percent}
        title="Add Rate"
        description={`A dated rate of ${taxGroup.name}. Rates of the same component, state and jurisdiction check can't overlap in time.`}
        content={(close) => <TaxGroupRateDialog taxGroup={taxGroup} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
