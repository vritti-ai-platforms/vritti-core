import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, FileText, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteBom } from '@/hooks/useDeleteBom';
import { BOM_TABLE_KEY, useBomTable } from '@/hooks/useBomTable';
import type { BomData } from '@/schemas/bom';
import { AddBomDialog } from './forms/AddBomDialog';

export const BomPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useBomTable();
  const deleteMutation = useDeleteBom();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const confirmed = await confirm({
        title: `Delete "${name}"?`,
        description: 'This BOM and all its lines will be permanently removed.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<BomData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        enableSorting: true,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'secondary' : 'outline'}
            className={row.original.isActive ? 'bg-success/15 text-success' : ''}
          >
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
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
    [navigate, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-bom',
    label: 'bill of materials',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: BOM_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Bill of Materials" description="Manage production recipes and component lists" />

      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'name', label: 'Name' },
            { id: 'code', label: 'Code' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Add BOM
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: FileText,
          title: 'No bills of materials',
          description: 'Create your first BOM to define production recipes.',
          action: (
            <Button onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              Add BOM
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="Add Bill of Materials"
        description="Create a new BOM. You can add component lines after creation."
        content={(close) => <AddBomDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
