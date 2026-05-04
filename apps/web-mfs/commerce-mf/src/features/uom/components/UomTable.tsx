import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Pencil, Plus, Ruler, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { UOM_TABLE_KEY, useDeleteUom, useUomTable } from '@/hooks/uom';
import type { UomData } from '@/schemas/uom';
import { AddUomDialog } from '../forms/AddUomDialog';
import { EditUomDialog } from '../forms/EditUomDialog';

interface UomTableProps {
  dimensionId: string;
  isLoading?: boolean;
}

export const UomTable: React.FC<UomTableProps> = ({ dimensionId, isLoading: parentLoading = false }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { data: response, isLoading: tableLoading } = useUomTable(dimensionId);
  const isLoading = parentLoading || tableLoading;
  const deleteMutation = useDeleteUom();
  const addDialog = useDialog();
  const editDialog = useDialog();
  const [editTarget, setEditTarget] = useState<UomData | null>(null);

  const openEdit = useCallback(
    (uom: UomData) => {
      setEditTarget(uom);
      editDialog.open();
    },
    [editDialog],
  );

  const closeEdit = useCallback(() => {
    editDialog.close();
    setEditTarget(null);
  }, [editDialog]);

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
        cell: ({ row }) => <span className="font-mono">{row.original.symbol}</span>,
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
        accessorKey: 'conversionFactor',
        header: 'Factor',
        enableSorting: true,
        cell: ({ row }) => <span className="font-mono">{row.original.conversionFactor}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                onClick: () => openEdit(row.original),
                disabled: !row.original.canEdit,
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                variant: 'destructive',
                onClick: () => handleDelete(row.original),
                disabled: !row.original.canDelete,
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [openEdit, handleDelete],
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
        title="Add UOM"
        description="Add a new unit of measure to this dimension."
        content={(close) => <AddUomDialog dimensionId={dimensionId} onSuccess={close} onCancel={close} />}
      />

      <Dialog
        handle={editDialog}
        title="Edit UOM"
        description="Update this unit of measure."
        content={() =>
          editTarget ? <EditUomDialog uom={editTarget} onSuccess={closeEdit} onCancel={closeEdit} /> : null
        }
      />
    </>
  );
};
