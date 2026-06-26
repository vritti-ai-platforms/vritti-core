import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
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
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { UomFilter } from '@vritti/quantum-ui/selects/uom';
import { Pencil, Plus, Ruler, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { UOM_TABLE_KEY, useDeleteUom, useUomTable } from '@/hooks/uom';
import type { UomData } from '@/schemas/uom';
import { AddUomDialog } from '../forms/AddUomDialog';
import { EditUomDialog } from '../forms/EditUomDialog';

interface UomTableProps {
  dimensionId: string;
}

export const UomTable: React.FC<UomTableProps> = ({ dimensionId }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { data: response, isLoading } = useUomTable(dimensionId);
  const deleteMutation = useDeleteUom();
  const addDialog = useDialog();

  const handleDelete = useCallback(
    async (uom: UomData) => {
      const confirmed = await confirm({
        title: `Delete "${uom.name}"?`,
        description: 'This unit will be permanently removed.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(uom.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<UomData>[]>(
    () => [
      {
        accessorKey: 'symbol',
        header: 'Symbol',
        enableSorting: true,
        cell: ({ row }) => <StringCell value={row.original.symbol} mono />,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
      },
      {
        id: 'kind',
        header: 'Kind',
        cell: ({ row }) => (
          <Badge variant={row.original.baseUnitId === null ? 'secondary' : 'outline'}>
            {row.original.baseUnitId === null ? 'Base' : 'Derived'}
          </Badge>
        ),
        enableSorting: false,
      },
      {
        id: 'baseUnit',
        header: 'Base',
        cell: ({ row }) => (
          <StringCell value={row.original.baseUnitSymbol} mono className="text-muted-foreground" />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'baseUomQty',
        header: 'Conversion',
        enableSorting: true,
        cell: ({ row }) => {
          const { baseUomQty, uomQty, symbol, baseUnitSymbol } = row.original;
          if (baseUnitSymbol == null) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="font-mono">
              <NumberCell value={uomQty} /> {symbol} = <NumberCell value={baseUomQty} /> {baseUnitSymbol}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const uom = row.original;
          const isBase = uom.baseUnitId === null;
          return (
            <RowActions
              actions={[
                {
                  id: 'edit',
                  icon: Pencil,
                  label: 'Edit',
                  disabled: !uom.canEdit,
                  dialog: {
                    title: 'Edit UOM',
                    description: 'Update this unit of measure.',
                    badgeSlot: <Badge variant="secondary">{isBase ? 'Base unit' : 'Derived unit'}</Badge>,
                    content: (close) => <EditUomDialog uom={uom} onSuccess={close} onCancel={close} />,
                  },
                },
                {
                  id: 'delete',
                  icon: Trash2,
                  label: 'Delete',
                  variant: 'destructive',
                  onClick: () => handleDelete(uom),
                  disabled: !uom.canDelete,
                },
              ]}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-uom-${dimensionId}`,
    label: 'UOM',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: [...UOM_TABLE_KEY, dimensionId] }),
  });

  return (
    <>
      <DataTable
        table={table}
        isLoading={isLoading}
        mode="compact"
        filters={[
          <SelectFilter
            key="kind"
            name="kind"
            label="Kind"
            options={[
              { label: 'Base', value: 'base' },
              { label: 'Derived', value: 'derived' },
            ]}
          />,
          <UomFilter key="baseUnitId" name="baseUnitId" label="Base Unit" params={{ baseOnly: true }} />,
        ]}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open} startAdornment={<Plus className="size-4" />}>
              Add UOM
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Ruler,
          title: 'No UOMs yet',
          description: 'Add a UOM to this dimension.',
          action: (
            <Button onClick={addDialog.open} startAdornment={<Plus className="size-4" />}>
              Add UOM
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Ruler}
        title="Add UOM"
        description="Add a new unit of measure to this dimension."
        content={(close) => <AddUomDialog dimensionId={dimensionId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
