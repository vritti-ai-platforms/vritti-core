import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  getSelectionColumn,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Boxes, CircleCheck, CircleSlash, Eye, Lock, Plus, Sparkles, SwatchBook, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusSwitch } from '@/components/StatusSwitch';
import { FULFILMENT_TYPE_META, type OfferingData, type OfferingVariantData } from '@/schemas/offerings';
import { AddVariantDialog } from '../forms/AddVariantDialog';
import type {
  OfferingPermissions,
  UseBulkSetVariantsStatus,
  UseCreateVariant,
  UseDeleteVariant,
  UseOfferingDimensions,
  UseOfferingVariantsTable,
  UseUpdateVariant,
} from '../types';

interface VariantsTabProps {
  useVariantsTable: UseOfferingVariantsTable;
  // The matrix wizard is a route; adding one by hand stays a dialog here
  useDimensions: UseOfferingDimensions;
  useCreateVariant: UseCreateVariant;
  useDelete: UseDeleteVariant;
  useUpdate: UseUpdateVariant;
  useBulkSetStatus: UseBulkSetVariantsStatus;
  tableKey: readonly unknown[];
  tableSlug: string;
  permissions: OfferingPermissions;
  offering: OfferingData;
}

export const VariantsTab: React.FC<VariantsTabProps> = ({
  permissions,
  offering,
  useVariantsTable,
  useDimensions,
  useCreateVariant,
  useDelete,
  useUpdate,
  useBulkSetStatus,
  tableKey,
  tableSlug,
}) => {
  const queryClient = useQueryClient();
  const { tab } = useParams();

  // A bare detail URL has no tab segment to climb out of, so the `..` is conditional
  const navigate = useNavigate();
  const goTo = useCallback(
    (target: string) => navigate(tab ? `../${target}` : target, { relative: 'path' }),
    [navigate, tab],
  );
  // Lands on the overview tab rather than the bare detail URL, which renders no tab at all
  const goToVariant = useCallback(
    (variant: { sku: string; id: string }) => goTo(`variants/${buildSlug(variant.sku, variant.id)}/overview`),
    [goTo],
  );
  const confirm = useConfirm();
  const { data: response, isLoading } = useVariantsTable(offering.id);
  const { data: dimensions = [] } = useDimensions(offering.id);
  const addDialog = useDialog();
  const deleteMutation = useDelete();
  const setStatusMutation = useUpdate();
  const bulkSetStatusMutation = useBulkSetStatus();

  const meta = FULFILMENT_TYPE_META[offering.fulfilmentType];

  const handleDelete = useCallback(
    async (variant: OfferingVariantData) => {
      const confirmed = await confirm({
        title: `Delete "${variant.sku}"?`,
        description: 'The variant and its bill of materials will be permanently removed.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(variant.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<OfferingVariantData>[]>(
    () => [
      getSelectionColumn<OfferingVariantData>(),
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => <StringCell value={row.original.sku} mono />,
        enableSorting: true,
      },
      {
        id: 'combination',
        header: 'Combination',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.values.map((value) => value.value).join(' · ')}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'salesUomName',
        header: 'Sold in',
        cell: ({ row }) => <StringCell value={row.original.salesUomName} />,
        enableSorting: false,
      },
      {
        accessorKey: 'bomLineCount',
        header: 'Bill of materials',
        cell: ({ row }) =>
          row.original.bomLineCount > 0 ? (
            <Badge variant="success">{pluralize('component', row.original.bomLineCount, true)}</Badge>
          ) : (
            <Badge variant={meta.minBomLines === 0 ? 'secondary' : 'warning'}>
              {meta.minBomLines === 0 ? 'not required' : 'needed'}
            </Badge>
          ),
        enableSorting: false,
      },
      {
        accessorKey: 'taxClassName',
        header: 'Tax Class',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <StringCell value={row.original.taxClassName} />
            {/* Only worth flagging the exception — following the offering is the norm */}
            {row.original.isTaxClassOverridden && (
              <Badge variant="outline" className="gap-1">
                <Lock className="size-3" />
                Override
              </Badge>
            )}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'isActive',
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <StatusSwitch
              checked={row.original.isActive}
              permission={permissions.variants.edit}
              disabled={!row.original.canMarkActive || setStatusMutation.isPending}
              disabledTip={`A ${meta.label.toLowerCase()} variant needs its bill of materials first.`}
              onCheckedChange={(isActive) => setStatusMutation.mutate({ id: row.original.id, data: { isActive } })}
              ariaLabel={`Mark ${row.original.sku} active`}
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
                onClick: () => goToVariant(row.original),
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                variant: 'destructive',
                hidden: !offering.canEdit,
                disabled: !row.original.canDelete,
                permission: permissions.variants.delete,
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [
      goToVariant,
      handleDelete,
      meta,
      offering,
      permissions.variants.delete,
      permissions.variants.edit,
      setStatusMutation,
    ],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: tableSlug,
    label: 'variant',
    enableRowSelection: true,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: tableKey }),
  });

  const handleBulkSetStatus = (ids: string[], isActive: boolean) =>
    bulkSetStatusMutation.mutate(
      { offeringId: offering.id, ids, isActive },
      { onSuccess: () => table.resetRowSelection() },
    );

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={permissions.variants.view}
        selectActions={(rows) => {
          const blocked = rows.filter((row) => !row.original.canMarkActive).length;
          return (
            <>
              <Button
                size="sm"
                variant="outline"
                permission={permissions.variants.edit}
                startAdornment={<CircleCheck className="size-4" />}
                isLoading={bulkSetStatusMutation.isPending}
                disabled={blocked > 0}
                disabledTip={
                  blocked > 0
                    ? `${pluralize('variant', blocked, true)} in this selection still need a bill of materials.`
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
                permission={permissions.variants.edit}
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
            { id: 'sku', label: 'SKU' },
            { id: 'externalSku', label: 'External SKU' },
          ],
          searchAll: true,
        }}
        filters={[
          <SelectFilter
            key="isTaxClassOverridden"
            name="isTaxClassOverridden"
            label="Tax Class"
            options={[
              { label: 'Overridden', value: 'true' },
              { label: 'Follows offering', value: 'false' },
            ]}
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
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                startAdornment={<Plus className="size-4" />}
                onClick={addDialog.open}
                disabled={dimensions.length === 0}
                permission={permissions.variants.add}
              >
                Add Variant
              </Button>
              <Button
                size="sm"
                startAdornment={<Sparkles className="size-4" />}
                onClick={() => goTo('variants/generate')}
                permission={permissions.variants.add}
              >
                Generate Variants
              </Button>
            </div>
          ),
        }}
        emptyStateConfig={{
          icon: Boxes,
          title: 'No variants yet',
          description:
            offering.dimensionCount === 0
              ? 'Add a dimension first — variants are combinations of dimension values.'
              : 'Generate variants from the combinations of your dimension values.',
          action:
            offering.dimensionCount === 0 ? (
              <Button
                variant="outline"
                onClick={() => goTo('dimensions')}
                startAdornment={<SwatchBook className="size-4" />}
                permission={permissions.dimensions.view}
              >
                Go to Dimensions
              </Button>
            ) : undefined,
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Boxes}
        title="Add Variant"
        description="One combination, added by hand. Its SKU is derived exactly as generation would."
        content={(close) => (
          <AddVariantDialog
            offering={offering}
            dimensions={dimensions}
            useCreate={useCreateVariant}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
