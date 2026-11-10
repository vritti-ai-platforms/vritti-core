import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { countryFlag } from '@vritti/quantum-ui/selects/iso-country';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  type PartyTaxRegistrationRow,
  REGISTRATION_SCHEME_LABELS,
  REGISTRATION_TYPE_LABELS,
} from '@/schemas/party-registrations';
import type { RegistrationsBinding } from '../../bindings';
import { AddRegistrationDialog } from './forms/AddRegistrationDialog';
import { EditRegistrationDialog } from './forms/EditRegistrationDialog';

interface RegistrationsTabProps {
  partyId: string;
  binding: RegistrationsBinding;
}

export const RegistrationsTab: React.FC<RegistrationsTabProps> = ({ partyId, binding }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const registrationsTableQuery = binding.useList(partyId);
  const deleteMutation = binding.useRemove(partyId);
  const setActiveMutation = binding.useSetActive(partyId);

  const handleDelete = useCallback(
    async (row: PartyTaxRegistrationRow) => {
      const confirmed = await confirm({
        title: 'Delete registration?',
        description: `Delete the "${REGISTRATION_TYPE_LABELS[row.registrationType]}" registration ${row.registrationNumber}?`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<PartyTaxRegistrationRow>[]>(
    () => [
      {
        accessorKey: 'countryCode',
        header: 'Country',
        cell: ({ row }) => `${countryFlag(row.original.countryCode)} ${row.original.countryCode}`,
        enableSorting: false,
      },
      {
        accessorKey: 'jurisdictionName',
        header: 'State',
        cell: ({ row }) =>
          row.original.jurisdictionName ?? <span className="text-muted-foreground">Whole country</span>,
        enableSorting: true,
      },
      {
        accessorKey: 'registrationNumber',
        header: 'Number',
        cell: ({ row }) => <StringCell value={row.original.registrationNumber} mono />,
      },
      {
        accessorKey: 'registrationType',
        header: 'Type',
        cell: ({ row }) => <Badge variant="outline">{REGISTRATION_TYPE_LABELS[row.original.registrationType]}</Badge>,
      },
      {
        accessorKey: 'scheme',
        header: 'Scheme',
        cell: ({ row }) => REGISTRATION_SCHEME_LABELS[row.original.scheme],
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
          <StatusSwitch
            checked={row.original.isActive}
            permission={binding.permissions.edit}
            disabled={row.original.isPrimary && row.original.isActive}
            disabledTip="The primary registration must stay active. Set another registration as primary first."
            isLoading={setActiveMutation.isPending && setActiveMutation.variables?.registrationId === row.original.id}
            onCheckedChange={(isActive) => setActiveMutation.mutate({ registrationId: row.original.id, isActive })}
            ariaLabel={`Mark ${row.original.registrationNumber} active`}
          />
        ),
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
                permission: binding.permissions.edit,
                dialog: {
                  title: 'Edit Tax Registration',
                  description: 'Update the details for this tax registration.',
                  content: (close) => (
                    <EditRegistrationDialog
                      partyId={partyId}
                      binding={binding}
                      registration={row.original}
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
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [setActiveMutation, handleDelete, partyId, binding],
  );

  const registrationsTable = useDataTable({
    columns,
    query: registrationsTableQuery,
    slug: binding.slug(partyId),
    label: 'registration',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.queryKey(partyId) }),
  });

  return (
    <>
      <DataTable
        table={registrationsTable}
        mode="tab"
        permission={binding.permissions.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={binding.permissions.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Registration
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: FileText,
          title: 'No tax registrations',
          description: binding.emptyDescription,
          action: (
            <Button
              permission={binding.permissions.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Registration
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={FileText}
        title="Add Tax Registration"
        description="Record a tax registration number for this party, in its country and state."
        content={(close) => (
          <AddRegistrationDialog partyId={partyId} binding={binding} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
