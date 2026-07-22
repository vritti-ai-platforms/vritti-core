import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { AtSign, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { type PartySocialProfileRow, SOCIAL_PLATFORM_LABELS } from '@/schemas/party-social-profiles';
import type { SocialProfilesBinding } from '../bindings';
import { AddSocialProfileDialog } from '../forms/AddSocialProfileDialog';
import { EditSocialProfileDialog } from '../forms/EditSocialProfileDialog';

interface SocialProfilesTabProps {
  partyId: string;
  binding: SocialProfilesBinding;
}

export const SocialProfilesTab: React.FC<SocialProfilesTabProps> = ({ partyId, binding }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = binding.useList(partyId);
  const deleteMutation = binding.useRemove(partyId);

  const handleDelete = useCallback(
    async (row: PartySocialProfileRow) => {
      const confirmed = await confirm({
        title: 'Delete social profile?',
        description: `Remove the ${SOCIAL_PLATFORM_LABELS[row.platform]} profile?`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<PartySocialProfileRow>[]>(
    () => [
      {
        accessorKey: 'platform',
        header: 'Platform',
        cell: ({ row }) => <Badge variant="secondary">{SOCIAL_PLATFORM_LABELS[row.original.platform]}</Badge>,
      },
      {
        accessorKey: 'url',
        header: 'Profile',
        cell: ({ row }) => (
          <a
            href={row.original.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <span className="max-w-[24rem] truncate">{row.original.url}</span>
            <ExternalLink className="size-3 shrink-0" />
          </a>
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
                  title: 'Edit Social Profile',
                  description: 'Update this social or web profile.',
                  content: (close) => (
                    <EditSocialProfileDialog
                      partyId={partyId}
                      binding={binding}
                      profile={row.original}
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
    label: 'social profile',
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
              Add Profile
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: AtSign,
          title: 'No social profiles',
          description: binding.emptyDescription,
          action: (
            <Button
              permission={binding.permissions.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Profile
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={AtSign}
        title="Add Social Profile"
        description="Record a social or web profile for this party."
        content={(close) => (
          <AddSocialProfileDialog partyId={partyId} binding={binding} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
