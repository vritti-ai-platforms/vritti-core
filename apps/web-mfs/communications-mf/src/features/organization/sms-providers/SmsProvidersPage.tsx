import { useQueryClient } from '@tanstack/react-query';
import { ORG_SMS_PROVIDERS } from '@vritti/communications-permissions/sms-providers';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Eye, MessageSquareText, Pencil, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SMS_PROVIDERS_TABLE_KEY, useSmsProviders } from '@/hooks/organization/sms-providers';
import type { SmsProviderData } from '@/schemas/sms-providers';
import { ConnectSmsProviderDialog } from './forms/ConnectSmsProviderDialog';
import { EditSmsProviderDialog } from './forms/EditSmsProviderDialog';

// PLATFORM rows are Vritti-managed and read-only here; CLIENT rows belong to the organization
const TypeBadge = ({ type }: { type: SmsProviderData['type'] }) =>
  type === 'PLATFORM' ? <Badge variant="secondary">Platform</Badge> : <Badge variant="outline">Client</Badge>;

export const SmsProvidersPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: response, isLoading } = useSmsProviders();
  const connectDialog = useDialog();

  // Every column carries an explicit size: DataTable takes the table's minWidth from their total
  const columns = useMemo<ColumnDef<SmsProviderData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <StringCell value={row.original.name} />,
        enableSorting: true,
        size: 220,
      },
      {
        accessorKey: 'provider',
        header: 'Provider',
        cell: ({ row }) => <Badge variant="outline">{row.original.provider.toLowerCase()}</Badge>,
        enableSorting: true,
        size: 130,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <TypeBadge type={row.original.type} />,
        enableSorting: true,
        size: 120,
      },
      {
        id: 'senderId',
        header: 'Sender ID',
        cell: ({ row }) => <StringCell value={row.original.senderId ?? '—'} mono />,
        enableSorting: false,
        size: 140,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="destructive">Inactive</Badge>
          ),
        enableSorting: true,
        size: 110,
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
                permission: ORG_SMS_PROVIDERS.view,
                onClick: () => navigate(row.original.id),
              },
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                permission: ORG_SMS_PROVIDERS.edit,
                // Platform rows are Vritti-managed — the org API rejects writes on them anyway
                hidden: row.original.type === 'PLATFORM',
                dialog: {
                  title: 'Edit SMS provider',
                  description: 'Update the name, sender ID, or replace the stored credentials.',
                  content: (close) => (
                    <EditSmsProviderDialog provider={row.original} onSuccess={close} onCancel={close} />
                  ),
                },
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 70,
      },
    ],
    [navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'communications-org-sms-providers',
    label: 'provider',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SMS_PROVIDERS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="SMS Providers" description="Senders for text messages — Vritti's and your own" />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_SMS_PROVIDERS.view}
        enableViews={false}
        onRowClick={(provider) => navigate(provider.id)}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              permission={ORG_SMS_PROVIDERS.add}
              onClick={connectDialog.open}
            >
              Connect provider
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: MessageSquareText,
          title: 'No SMS providers yet',
          description: "Connect your own provider, or use one of Vritti's platform senders when available.",
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              permission={ORG_SMS_PROVIDERS.add}
              onClick={connectDialog.open}
            >
              Connect provider
            </Button>
          ),
        }}
      />

      <Dialog
        handle={connectDialog}
        icon={MessageSquareText}
        title="Connect SMS provider"
        description="Store your provider account's credentials so apps can send through it."
        content={(close) => <ConnectSmsProviderDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
