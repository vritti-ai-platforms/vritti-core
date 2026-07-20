import { useQueryClient } from '@tanstack/react-query';
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
import { Pencil, Plus, ScrollText, Trash2 } from 'lucide-react';
import type React from 'react';
import { type ReactNode, useCallback, useMemo } from 'react';
import { LICENSE_TYPE_LABELS, type PartyLicenseRow } from '@/schemas/party-licenses';
import type { LicensesBinding } from '../bindings';
import { AddLicenseDialog } from '../forms/AddLicenseDialog';
import { EditLicenseDialog } from '../forms/EditLicenseDialog';

interface LicensesTabProps {
  partyId: string;
  binding: LicensesBinding;
}

const EXPIRY_SOON_DAYS = 30;

function expiryBadge(validTo: string): ReactNode {
  const expiry = new Date(validTo);
  if (Number.isNaN(expiry.getTime())) return null;
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + EXPIRY_SOON_DAYS);
  if (expiry < now) return <Badge variant="destructive">Expired</Badge>;
  if (expiry <= soon) return <Badge variant="warning">Expiring soon</Badge>;
  return null;
}

export const LicensesTab: React.FC<LicensesTabProps> = ({ partyId, binding }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = binding.useList(partyId);
  const deleteMutation = binding.useRemove(partyId);

  const handleDelete = useCallback(
    async (row: PartyLicenseRow) => {
      const confirmed = await confirm({
        title: 'Delete license?',
        description: `Delete the "${LICENSE_TYPE_LABELS[row.licenseType]}" license ${row.licenseNumber}?`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<PartyLicenseRow>[]>(
    () => [
      {
        accessorKey: 'licenseType',
        header: 'Type',
        cell: ({ row }) => <Badge variant="outline">{LICENSE_TYPE_LABELS[row.original.licenseType]}</Badge>,
      },
      {
        accessorKey: 'licenseNumber',
        header: 'Number',
        cell: ({ row }) => <StringCell value={row.original.licenseNumber} mono />,
      },
      {
        accessorKey: 'region',
        header: 'Region',
        cell: ({ row }) => <StringCell value={row.original.region} />,
      },
      {
        accessorKey: 'validTo',
        header: 'Valid To',
        cell: ({ row }) =>
          row.original.validTo ? (
            <div className="flex items-center gap-2">
              <DateCell value={row.original.validTo} />
              {expiryBadge(row.original.validTo)}
            </div>
          ) : (
            '—'
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
                  title: 'Edit License',
                  description: 'Update the details for this license.',
                  content: (close) => (
                    <EditLicenseDialog
                      partyId={partyId}
                      binding={binding}
                      license={row.original}
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
    label: 'license',
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
              Add License
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: ScrollText,
          title: 'No licenses',
          description: binding.emptyDescription,
          action: (
            <Button
              permission={binding.permissions.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add License
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={ScrollText}
        title="Add License"
        description="Record a regulatory license for this party."
        content={(close) => <AddLicenseDialog partyId={partyId} binding={binding} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
