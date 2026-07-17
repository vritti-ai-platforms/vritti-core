import { useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { countryFlag } from '@vritti/quantum-ui/selects/iso-country';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  COMPANY_ADDRESSES_TABLE_KEY,
  useCompanyAddresses,
  useRemoveCompanyAddress,
} from '@/hooks/organization/companies';
import { ADDRESS_TYPE_LABELS, type PartyAddressRow } from '@/schemas/party-addresses';
import { AddAddressDialog } from '../forms/AddAddressDialog';
import { EditAddressDialog } from '../forms/EditAddressDialog';

interface AddressesTabProps {
  partyId: string;
}

export const AddressesTab: React.FC<AddressesTabProps> = ({ partyId }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = useCompanyAddresses(partyId);
  const deleteMutation = useRemoveCompanyAddress(partyId);

  const handleDelete = useCallback(
    async (row: PartyAddressRow) => {
      const confirmed = await confirm({
        title: 'Remove address?',
        description: `Remove the "${ADDRESS_TYPE_LABELS[row.type]}" address at ${row.line1}?`,
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
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <Badge variant="outline">{ADDRESS_TYPE_LABELS[row.original.type]}</Badge>,
      },
      {
        accessorKey: 'line1',
        header: 'Address',
        cell: ({ row }) => {
          const secondary = [row.original.city, row.original.region, row.original.postalCode]
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
        accessorKey: 'isPrimary',
        header: 'Primary',
        cell: ({ row }) => (row.original.isPrimary ? <Badge variant="success">Primary</Badge> : '—'),
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
                dialog: {
                  title: 'Edit Address',
                  description: 'Update the postal address for this party.',
                  className: 'max-w-3xl',
                  content: (close) => (
                    <EditAddressDialog
                      partyId={partyId}
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
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, partyId],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-org-company-${partyId}-addresses`,
    label: 'address',
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: COMPANY_ADDRESSES_TABLE_KEY(partyId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={ORG_COMPANIES.view}
        toolbarActions={{
          actions: (
            <Button size="sm" startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
              Add Address
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: MapPin,
          title: 'No addresses',
          description: "Record this company's registered, billing, or shipping addresses.",
          action: (
            <Button startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
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
        content={(close) => <AddAddressDialog partyId={partyId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
