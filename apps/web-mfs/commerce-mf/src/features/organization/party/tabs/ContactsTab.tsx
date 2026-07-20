import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Contact, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { CONTACT_PURPOSE_LABELS, type PartyContactRow } from '@/schemas/party-contacts';
import type { ContactsBinding } from '../bindings';
import { AddContactDialog } from '../forms/AddContactDialog';
import { EditContactDialog } from '../forms/EditContactDialog';

interface ContactsTabProps {
  partyId: string;
  binding: ContactsBinding;
}

export const ContactsTab: React.FC<ContactsTabProps> = ({ partyId, binding }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = binding.useList(partyId);
  const deleteMutation = binding.useRemove(partyId);

  const handleDelete = useCallback(
    async (row: PartyContactRow) => {
      const confirmed = await confirm({
        title: 'Delete contact?',
        description: `Delete the "${CONTACT_PURPOSE_LABELS[row.purpose]}" contact${row.name ? ` ${row.name}` : ''}?`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<PartyContactRow>[]>(
    () => [
      {
        accessorKey: 'purpose',
        header: 'Purpose',
        cell: ({ row }) => <Badge variant="outline">{CONTACT_PURPOSE_LABELS[row.original.purpose]}</Badge>,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <StringCell value={row.original.name} />,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <StringCell value={row.original.email} />,
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => <StringCell value={row.original.phone} mono />,
      },
      {
        accessorKey: 'isPrimary',
        header: 'Primary',
        cell: ({ row }) => (row.original.isPrimary ? <Badge variant="success">Primary</Badge> : '—'),
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
                  title: 'Edit Contact',
                  description: 'Update the details for this contact.',
                  content: (close) => (
                    <EditContactDialog
                      partyId={partyId}
                      binding={binding}
                      contact={row.original}
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
    label: 'contact',
    enableRowSelection: false,
    enableSorting: false,
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
              Add Contact
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Contact,
          title: 'No contacts',
          description: binding.emptyDescription,
          action: (
            <Button
              permission={binding.permissions.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Contact
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Contact}
        title="Add Contact"
        description="Record a point of contact for this party."
        content={(close) => <AddContactDialog partyId={partyId} binding={binding} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
