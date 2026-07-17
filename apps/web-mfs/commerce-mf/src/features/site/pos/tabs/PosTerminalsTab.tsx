import { useQueryClient } from '@tanstack/react-query';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Monitor, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PosTerminalData } from '@/schemas/pos-terminals';
import { POS_TERMINALS_TABLE_KEY, useDeletePosTerminal, usePosTerminalsTable } from '@/hooks/site/pos-terminals';
import { getErrorMessage } from '@/utils/error';
import { PosTerminalForm } from '../forms/PosTerminalForm';

export const PosTerminalsTab = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data: response, isLoading, error } = usePosTerminalsTable();
  const deleteMutation = useDeletePosTerminal();

  const addDialog = useDialog();
  const [editingTerminal, setEditingTerminal] = useState<PosTerminalData | null>(null);
  const editDialog = useDialog({ onClose: () => setEditingTerminal(null) });

  const handleEdit = useCallback(
    (terminal: PosTerminalData) => {
      setEditingTerminal(terminal);
      editDialog.open();
    },
    [editDialog],
  );

  const handleDelete = useCallback(
    async (terminal: PosTerminalData) => {
      const confirmed = await confirm({
        title: `Delete "${terminal.name}"?`,
        description: 'This POS terminal will be permanently removed.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });

      if (confirmed) {
        deleteMutation.mutate(terminal.id);
      }
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<PosTerminalData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        enableSorting: true,
      },
      {
        accessorKey: 'name',
        header: 'Terminal',
        enableSorting: true,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'locationName',
        header: 'Linked Location',
        enableSorting: true,
        cell: ({ row }) => <StringCell value={row.original.locationName} />,
      },
      {
        accessorKey: 'locationPath',
        header: 'Path',
        enableSorting: false,
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.locationPath ?? '—'}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        enableSorting: true,
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? 'secondary' : 'outline'}
            className={row.original.isActive ? 'bg-success/15 text-success' : ''}
          >
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        enableSorting: true,
        cell: ({ row }) => <DateCell value={row.original.updatedAt} />,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
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
                disabled: deleteMutation.isPending,
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [deleteMutation.isPending, handleDelete, handleEdit, navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-site-pos-terminals',
    label: 'POS terminal',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: POS_TERMINALS_TABLE_KEY }),
  });

  return (
    <div className="space-y-4">
      {error ? <Alert variant="destructive" title="Failed to load" description={getErrorMessage(error)} /> : null}
      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'name', label: 'Terminal' },
            { id: 'code', label: 'Code' },
            { id: 'locationName', label: 'Linked Location' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open} startAdornment={<Plus className="size-4" />}>
              Add Terminal
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Monitor,
          title: 'No POS terminals',
          description: 'Create your first POS terminal and link it to a POS storage location.',
          action: (
            <Button onClick={addDialog.open} startAdornment={<Plus className="size-4" />}>
              Add Terminal
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Monitor}
        title="Add POS Terminal"
        description="Create a terminal and map it to a POS storage location."
        className="max-w-lg"
        content={(close) => <PosTerminalForm onSuccess={close} onCancel={close} />}
      />

      {editingTerminal && (
        <Dialog
          handle={editDialog}
          icon={Monitor}
          title="Edit POS Terminal"
          description="Update terminal details or switch the linked POS storage location."
          className="max-w-lg"
          content={(close) => <PosTerminalForm terminal={editingTerminal} onSuccess={close} onCancel={close} />}
        />
      )}
    </div>
  );
};
