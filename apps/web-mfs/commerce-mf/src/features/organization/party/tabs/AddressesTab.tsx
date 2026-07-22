import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { countryFlag } from '@vritti/quantum-ui/selects/iso-country';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { ADDRESS_FUNCTION_LABELS, type PartyAddressRow } from '@/schemas/party-addresses';
import type { AddressesBinding } from '../bindings';
import { FunctionChips } from '../FunctionChips';
import { AddAddressDialog } from '../forms/AddAddressDialog';
import { EditAddressDialog } from '../forms/EditAddressDialog';

interface AddressesTabProps {
  partyId: string;
  binding: AddressesBinding;
}

export const AddressesTab: React.FC<AddressesTabProps> = ({ partyId, binding }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = binding.useList(partyId);
  const deleteMutation = binding.useRemove(partyId);

  const handleDelete = useCallback(
    async (row: PartyAddressRow) => {
      const confirmed = await confirm({
        title: 'Remove address?',
        description: `Remove the address at ${row.line1}?`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<PartyAddressRow>[]>(
    () => [
      {
        accessorKey: 'line1',
        header: 'Address',
        cell: ({ row }) => {
          const secondary = [row.original.line2, row.original.city, row.original.region, row.original.postalCode]
            .filter(Boolean)
            .join(', ');
          return (
            <div className="flex flex-col">
              <StringCell value={row.original.line1} />
              {secondary && <span className="text-xs text-muted-foreground">{secondary}</span>}
            </div>
          );
        },
      },
      {
        accessorKey: 'countryCode',
        header: 'Country',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {countryFlag(row.original.countryCode)} {row.original.countryCode}
          </Badge>
        ),
      },
      {
        accessorKey: 'functions',
        header: 'Handles',
        enableSorting: false,
        cell: ({ row }) => <FunctionChips functions={row.original.functions} labels={ADDRESS_FUNCTION_LABELS} />,
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
                  title: 'Edit Address',
                  description: 'Update the postal address for this party.',
                  className: 'max-w-3xl',
                  content: (close) => (
                    <EditAddressDialog
                      partyId={partyId}
                      binding={binding}
                      address={row.original}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Remove',
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
    [handleDelete, partyId, binding],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: binding.slug(partyId),
    label: 'address',
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
              Add Address
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: MapPin,
          title: 'No addresses',
          description: binding.emptyDescription,
          action: (
            <Button
              permission={binding.permissions.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Address
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={MapPin}
        title="Add Address"
        description="Record a postal address for this party."
        className="max-w-3xl"
        content={(close) => <AddAddressDialog partyId={partyId} binding={binding} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
