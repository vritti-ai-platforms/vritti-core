import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  getSelectionColumn,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { CircleCheck, CircleSlash, Eye, Plus, ShoppingBag } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusSwitch } from '@/components/StatusSwitch';
import type { OfferingData } from '@/schemas/offerings';
import { FULFILMENT_TYPE_META, OWNER_SCOPE_LABEL } from '@/schemas/offerings';
import type { OfferingsBinding } from './bindings';
import { AddOfferingDialog } from './forms/AddOfferingDialog';

interface OfferingsTableProps {
  binding: OfferingsBinding;
}

export const OfferingsTable: React.FC<OfferingsTableProps> = ({ binding }) => {
  const { permissions: PERMISSIONS } = binding;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = binding.useOfferingsTable();
  const addDialog = useDialog();
  const setStatusMutation = binding.useSetOfferingStatus();
  const bulkSetStatusMutation = binding.useBulkSetOfferingsStatus();

  const columns = useMemo<ColumnDef<OfferingData>[]>(
    () => [
      getSelectionColumn<OfferingData>(),
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
        enableSorting: true,
      },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'fulfilmentType',
        header: 'Fulfilment',
        cell: ({ row }) => <Badge variant="outline">{FULFILMENT_TYPE_META[row.original.fulfilmentType].label}</Badge>,
        enableSorting: false,
      },
      {
        accessorKey: 'ownerScope',
        header: 'Owner',
        cell: ({ row }) => <Badge variant="secondary">{OWNER_SCOPE_LABEL[row.original.ownerScope]}</Badge>,
        enableSorting: false,
      },
      {
        accessorKey: 'dimensionCount',
        header: 'Dimensions',
        cell: ({ row }) => <NumberCell value={row.original.dimensionCount} />,
        enableSorting: false,
      },
      {
        accessorKey: 'variantCount',
        header: 'Variants',
        cell: ({ row }) => <NumberCell value={row.original.variantCount} />,
        enableSorting: false,
      },
      {
        accessorKey: 'isActive',
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <StatusSwitch
              checked={row.original.isActive}
              permission={PERMISSIONS.toggle}
              disabled={!row.original.canMarkActive || setStatusMutation.isPending}
              disabledTip={
                row.original.canEdit ? 'Generate a variant first' : 'This offering belongs to a wider scope.'
              }
              onCheckedChange={(isActive) => setStatusMutation.mutate({ id: row.original.id, isActive })}
              ariaLabel={`Mark ${row.original.name} active`}
            />
          </div>
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
                id: 'view',
                icon: Eye,
                label: 'View',
                onClick: () => navigate(buildSlug(row.original.name, row.original.id)),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate, PERMISSIONS.toggle, setStatusMutation],
  );

  const { table } = useDataTable({
    columns,
    slug: binding.tableSlug,
    label: 'offering',
    serverState: response,
    enableRowSelection: true,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.tableKey }),
  });

  const handleBulkSetStatus = (ids: string[], isActive: boolean) =>
    bulkSetStatusMutation.mutate({ ids, isActive }, { onSuccess: () => table.resetRowSelection() });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Offerings" description={binding.listDescription} />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={PERMISSIONS.view}
        selectActions={(rows) => {
          const blocked = rows.filter((row) => !row.original.canMarkActive).length;
          return (
            <>
              <Button
                size="sm"
                variant="outline"
                permission={PERMISSIONS.toggle}
                startAdornment={<CircleCheck className="size-4" />}
                isLoading={bulkSetStatusMutation.isPending}
                disabled={blocked > 0}
                disabledTip={
                  blocked > 0
                    ? `${pluralize('offering', blocked, true)} in this selection cannot be made active yet.`
                    : undefined
                }
                onClick={() =>
                  handleBulkSetStatus(
                    rows.map((row) => row.original.id),
                    true,
                  )
                }
              >
                Mark Active
              </Button>
              <Button
                size="sm"
                variant="outline"
                permission={PERMISSIONS.toggle}
                startAdornment={<CircleSlash className="size-4" />}
                isLoading={bulkSetStatusMutation.isPending}
                onClick={() =>
                  handleBulkSetStatus(
                    rows.map((row) => row.original.id),
                    false,
                  )
                }
              >
                Mark Draft
              </Button>
            </>
          );
        }}
        searchConfig={{
          columns: [
            { id: 'name', label: 'Name' },
            { id: 'code', label: 'Code' },
          ],
          searchAll: true,
        }}
        filters={[
          <SelectFilter
            key="fulfilmentType"
            name="fulfilmentType"
            label="Fulfilment"
            multiple
            options={Object.entries(FULFILMENT_TYPE_META).map(([value, { label }]) => ({ label, value }))}
          />,
          <SelectFilter
            key="isActive"
            name="isActive"
            label="Status"
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Draft', value: 'false' },
            ]}
          />,
        ]}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open} permission={PERMISSIONS.add}>
              <Plus className="mr-2 size-4" />
              Add Offering
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: ShoppingBag,
          title: 'No offerings yet',
          description: 'Create an offering, add its dimensions, then generate variants from the combinations.',
        }}
      />

      <Dialog
        handle={addDialog}
        icon={ShoppingBag}
        title="Add Offering"
        description="Its code becomes the prefix of every variant SKU, so it cannot be changed later."
        content={(close) => (
          <AddOfferingDialog useCreate={binding.useCreateOffering} onSuccess={close} onCancel={close} />
        )}
        className="max-w-3xl"
      />
    </div>
  );
};
