import { useQueryClient } from '@tanstack/react-query';
import { ORG_TAX_CLASSES } from '@vritti/commerce-permissions/tax-classes';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { DateFilter } from '@vritti/quantum-ui/DateFilter';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { filter } from '@vritti/quantum-ui/filter';
import { useDialog, useOrgCountryCode, useWorkspaceTimeZone } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { ISOCountryFilter } from '@vritti/quantum-ui/selects/iso-country';
import { isoTodayDate } from '@vritti/quantum-ui/timezone';
import { Eye, Plus, Tags } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TAX_CLASSES_TABLE_KEY, useSetTaxClassActive, useTaxClassesTable } from '@/hooks/organization/tax-classes';
import type { TaxClassRowData } from '@/schemas/tax-classes';
import { TaxGroupsInForceCell } from './components/TaxGroupsInForceCell';
import { taxClassPath } from './components/taxClassPath';
import { AddTaxClassDialog } from './forms/AddTaxClassDialog';

// Every tax class with the tax groups it is taxed by on a day (today by default) in the chosen country
export const TaxClassesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const orgCountryCode = useOrgCountryCode();
  const timeZone = useWorkspaceTimeZone();
  const taxClassesTableQuery = useTaxClassesTable();
  const addDialog = useDialog();
  const setActiveMutation = useSetTaxClassActive();

  const columns = useMemo<ColumnDef<TaxClassRowData>[]>(
    () => [
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
        id: 'taxGroups',
        header: 'Tax Group',
        cell: ({ row }) => <TaxGroupsInForceCell taxGroups={row.original.taxGroups} />,
        enableSorting: false,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <StatusSwitch
            checked={row.original.isActive}
            permission={ORG_TAX_CLASSES.toggle}
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
          return (
            <RowActions
              actions={[
                {
                  id: 'view',
                  icon: Eye,
                  label: 'View',
                  onClick: () => navigate(taxClassPath(row.original, 'overview')),
                },
              ]}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate, setActiveMutation],
  );

  const taxClassesTable = useDataTable({
    columns,
    slug: 'commerce-org-tax-classes',
    label: 'tax class',
    query: taxClassesTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: TAX_CLASSES_TABLE_KEY }),
    defaultContext: [filter('country').equals(orgCountryCode), filter('asOf').equals(isoTodayDate(timeZone))],
    resetOnOpen: ['asOf'],
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tax Classes"
        description="What a product is for tax, and the tax group each class is taxed by in a country on a day."
      />

      <DataTable
        table={taxClassesTable}
        permission={ORG_TAX_CLASSES.view}
        contextBar={
          <>
            <ISOCountryFilter name="country" mode="context" />
            <DateFilter name="asOf" label="As of" mode="context" />
          </>
        }
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
