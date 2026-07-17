import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Fingerprint, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  useCompanyIdentifiers,
  useRemoveCompanyIdentifier,
} from '@/hooks/organization/companies';
import { IDENTIFIER_TYPE_LABELS, type PartyIdentifierRow } from '@/schemas/party-identifiers';
import { AddIdentifierDialog } from '../forms/AddIdentifierDialog';

interface IdentifiersTabProps {
  partyId: string;
  permission: string;
  slug: string;
  queryKey: readonly unknown[];
  emptyDescription: string;
}

export const IdentifiersTab: React.FC<IdentifiersTabProps> = ({
  partyId,
  permission,
  slug,
  queryKey,
  emptyDescription,
}) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = useCompanyIdentifiers(partyId);
  const deleteMutation = useRemoveCompanyIdentifier(partyId);

  const handleDelete = useCallback(
    async (row: PartyIdentifierRow) => {
      const confirmed = await confirm({
        title: 'Remove identifier?',
        description: `Remove the "${IDENTIFIER_TYPE_LABELS[row.idType]}" identifier ${row.idValue}?`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<PartyIdentifierRow>[]>(
    () => [
      {
        accessorKey: 'idType',
        header: 'Type',
        cell: ({ row }) => <Badge variant="outline">{IDENTIFIER_TYPE_LABELS[row.original.idType]}</Badge>,
      },
      {
        accessorKey: 'idValue',
        header: 'Number',
        cell: ({ row }) => <StringCell value={row.original.idValue} mono />,
      },
      {
        accessorKey: 'isPrimary',
        header: 'Primary',
        cell: ({ row }) =>
          row.original.isPrimary ? (
            <Badge variant="secondary" className="bg-success/15 text-success">
              Primary
            </Badge>
          ) : (
            '—'
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
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
    [handleDelete],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug,
    label: 'identifier',
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={permission}
        toolbarActions={{
          actions: (
            <Button size="sm" startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
              Add Identifier
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Fingerprint,
          title: 'No identifiers',
          description: emptyDescription,
          action: (
            <Button startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
              Add Identifier
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Fingerprint}
        title="Add Identifier"
        description="Record an identity document number for this party."
        content={(close) => <AddIdentifierDialog partyId={partyId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
