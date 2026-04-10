import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Ruler, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useDeleteUom } from '@/hooks/useDeleteUom';
import { UOM_TABLE_KEY, useUomTable } from '@/hooks/useUom';
import type { UomData } from '@/schemas/uom';
import { AddUomDialog } from './forms/AddUomDialog';
import { EditUomDialog } from './forms/EditUomDialog';

export const UomPage = () => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useUomTable();
  const deleteMutation = useDeleteUom();
  const addDialog = useDialog();
  const editDialog = useDialog();
  const confirm = useConfirm();
  const [editingUom, setEditingUom] = useState<UomData | null>(null);

  const handleEdit = useCallback(
    (uom: UomData) => {
      setEditingUom(uom);
      editDialog.open();
    },
    [editDialog],
  );

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const confirmed = await confirm({
        title: `Delete "${name}"?`,
        description: 'This unit of measure will be permanently removed. Items using it will need to be updated.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<UomData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
      },
      {
        accessorKey: 'symbol',
        header: 'Symbol',
        cell: ({ row }) => <Badge variant="outline">{row.original.symbol}</Badge>,
        enableSorting: true,
      },
      {
        accessorKey: 'baseUnitSymbol',
        header: 'Base Unit',
        cell: ({ row }) => row.original.baseUnitSymbol ?? <span className="text-muted-foreground">— (base)</span>,
      },
      {
        accessorKey: 'conversionFactor',
        header: 'Conversion Factor',
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
                onClick: () => handleEdit(row.original),
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                variant: 'destructive',
                onClick: () => handleDelete(row.original.id, row.original.name),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleEdit, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-uom',
    label: 'unit',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: UOM_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Units of Measure" description="Manage units used across inventory and catalog" />

      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'name', label: 'Name' },
            { id: 'symbol', label: 'Symbol' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Unit
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Ruler,
          title: 'No units of measure',
          description: 'Add your first unit to get started.',
          action: (
            <Button onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Unit
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="Add Unit of Measure"
        description="Create a new unit. Base units have no parent and a conversion factor of 1."
        content={(close) => <AddUomDialog onSuccess={close} onCancel={close} />}
      />

      <Dialog
        handle={editDialog}
        title="Edit Unit of Measure"
        content={(close) =>
          editingUom ? <EditUomDialog uom={editingUom} onSuccess={close} onCancel={close} /> : null
        }
      />
    </div>
  );
};
