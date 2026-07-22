import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { AtSign, Mail, Pencil, Phone, Plus, Star, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { COMMUNICATION_CHANNEL_LABELS, type PartyCommunicationRow } from '@/schemas/party-communications';
import { AppChips } from '../AppChips';
import type { CommunicationsBinding } from '../bindings';
import { AddCommunicationDialog } from '../forms/AddCommunicationDialog';
import { EditCommunicationDialog } from '../forms/EditCommunicationDialog';

interface CommunicationsTabProps {
  partyId: string;
  binding: CommunicationsBinding;
}

export const CommunicationsTab: React.FC<CommunicationsTabProps> = ({ partyId, binding }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = binding.useList(partyId);
  const deleteMutation = binding.useRemove(partyId);

  const handleDelete = useCallback(
    async (row: PartyCommunicationRow) => {
      const confirmed = await confirm({
        title: 'Delete communication?',
        description: `Remove ${COMMUNICATION_CHANNEL_LABELS[row.channel].toLowerCase()} "${row.value}"?`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<PartyCommunicationRow>[]>(
    () => [
      {
        accessorKey: 'channel',
        header: 'Channel',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.channel === 'EMAIL' ? <Mail className="size-3" /> : <Phone className="size-3" />}
            {COMMUNICATION_CHANNEL_LABELS[row.original.channel]}
          </Badge>
        ),
      },
      {
        accessorKey: 'value',
        header: 'Value',
        cell: ({ row }) => <StringCell value={row.original.value} mono />,
      },
      {
        accessorKey: 'apps',
        header: 'Apps',
        enableSorting: false,
        cell: ({ row }) => <AppChips apps={row.original.apps} />,
      },
      {
        accessorKey: 'isPrimary',
        header: 'Primary',
        cell: ({ row }) =>
          row.original.isPrimary ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/12 px-2 py-0.5 text-xs font-medium text-warning ring-1 ring-inset ring-warning/25">
              <Star className="size-3 fill-current" />
              Primary
            </span>
          ) : (
            <span className="text-muted-foreground/60">—</span>
          ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'outline'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
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
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                permission: binding.permissions.edit,
                dialog: {
                  title: 'Edit Communication',
                  description: 'Update this email address or phone number.',
                  content: (close) => (
                    <EditCommunicationDialog
                      partyId={partyId}
                      binding={binding}
                      communication={row.original}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                variant: 'destructive',
                permission: binding.permissions.delete,
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [handleDelete, partyId, binding],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: binding.slug(partyId),
    label: 'communication',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.queryKey(partyId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={binding.permissions.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={binding.permissions.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Communication
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: AtSign,
          title: 'No communications',
          description: binding.emptyDescription,
          action: (
            <Button
              permission={binding.permissions.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Communication
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={AtSign}
        title="Add Communication"
        description="Record an email address or phone number for this party."
        content={(close) => (
          <AddCommunicationDialog partyId={partyId} binding={binding} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
