import { useQueryClient } from '@tanstack/react-query';
import { ORG_TAX_GROUPS } from '@vritti/commerce-permissions/tax-groups';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { filter } from '@vritti/quantum-ui/filter';
import { useDialog, useOrgCountryCode } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { ISOCountryFilter } from '@vritti/quantum-ui/selects/iso-country';
import { Eye, Percent, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TAX_GROUPS_TABLE_KEY, useSetTaxGroupActive, useTaxGroupsTable } from '@/hooks/organization/tax-groups';
import type { TaxGroupData } from '@/schemas/tax-groups';
import { TaxTreatmentBadge } from './components/TaxTreatmentBadge';
import { taxGroupPath } from './components/taxGroupPath';
import { AddTaxGroupDialog } from './forms/AddTaxGroupDialog';

export const TaxGroupsPage = () => {
  const orgCountryCode = useOrgCountryCode();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const taxGroupsTableQuery = useTaxGroupsTable();
  const addDialog = useDialog();
  const setActiveMutation = useSetTaxGroupActive();

  const columns = useMemo<ColumnDef<TaxGroupData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
        enableSorting: true,
      },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'treatment',
        header: 'Treatment',
        cell: ({ row }) => <TaxTreatmentBadge treatment={row.original.treatment} />,
        enableSorting: true,
      },
      {
        accessorKey: 'rateCount',
        header: 'Rates',
        cell: ({ row }) => <NumberCell value={row.original.rateCount} />,
        enableSorting: false,
      },
      {
        accessorKey: 'classCount',
        header: 'Classes',
        cell: ({ row }) => <NumberCell value={row.original.classCount} />,
        enableSorting: false,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <StatusSwitch
            checked={row.original.isActive}
            permission={ORG_TAX_GROUPS.toggle}
            disabled={row.original.isActive && !row.original.canDeactivate}
            disabledTip="Tax classes are mapped to this group today or from a later day. End those mappings first."
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
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'view',
                icon: Eye,
                label: 'View',
                onClick: () => navigate(taxGroupPath(row.original, 'overview')),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate, setActiveMutation],
  );

  const taxGroupsTable = useDataTable({
    columns,
    slug: 'commerce-org-tax-groups',
    label: 'tax group',
    query: taxGroupsTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: TAX_GROUPS_TABLE_KEY }),
    defaultContext: [filter('country').equals(orgCountryCode)],
  });
  const { contextValue } = taxGroupsTable;
  const country = contextValue('country');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tax Groups"
        description="The rates each country charges, with their dated rates per state, and the tax classes each group taxes."
      />

      <DataTable
        table={taxGroupsTable}
        permission={ORG_TAX_GROUPS.view}
        contextBar={<ISOCountryFilter name="country" mode="context" />}
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
              permission={ORG_TAX_GROUPS.add}
            >
              Add Tax Group
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Percent,
          title: 'No tax groups',
          description: 'Add a tax group for this country, then give it dated rates and map tax classes to it.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_TAX_GROUPS.add}
            >
              Add Tax Group
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Percent}
        title="Add Tax Group"
        description="A tax group is a rate a country charges, like GST 5% or VAT 0%. You add its rates next."
        content={(close) => (
          <AddTaxGroupDialog
            countryCode={country}
            onSuccess={({ data }) => {
              close();
              navigate(taxGroupPath(data, 'rates'));
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
