import { useQueryClient } from '@tanstack/react-query';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateTimeCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Eye, MessageCircle, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWhatsappAccounts, WHATSAPP_ACCOUNTS_TABLE_KEY } from '@/hooks/organization/whatsapp-accounts';
import type { WhatsappAccountData } from '@/schemas/whatsapp-accounts';
import { ConnectWhatsappAccountDialog } from './forms/ConnectWhatsappAccountDialog';

export const WhatsappAccountsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useWhatsappAccounts();
  const connectDialog = useDialog();

  // Every column carries an explicit size: DataTable takes the table's minWidth from their total, so the
  // TanStack default of 150px each would force a horizontal scrollbar the content does not need.
  const columns = useMemo<ColumnDef<WhatsappAccountData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <StringCell value={row.original.name} />
            {row.original.isDefault && <Badge variant="secondary">Default</Badge>}
          </div>
        ),
        size: 240,
      },
      {
        accessorKey: 'wabaId',
        header: 'WABA ID',
        cell: ({ row }) => <StringCell value={row.original.wabaId} mono />,
        size: 180,
      },
      {
        accessorKey: 'metaBusinessId',
        header: 'Business portfolio',
        cell: ({ row }) => <StringCell value={row.original.metaBusinessId} mono />,
        size: 180,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'outline' : 'destructive'}>
            {row.original.isActive ? 'Connected' : 'Disabled'}
          </Badge>
        ),
        size: 110,
      },
      {
        accessorKey: 'createdAt',
        header: 'Connected',
        cell: ({ row }) => <DateTimeCell value={row.original.createdAt} />,
        size: 160,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions actions={[{ id: 'view', icon: Eye, label: 'View', onClick: () => navigate(row.original.id) }]} />
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
    slug: 'communications-org-whatsapp-accounts',
    label: 'WhatsApp account',
    serverState: response,
    enableRowSelection: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: WHATSAPP_ACCOUNTS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="WhatsApp accounts" description="WhatsApp Business Accounts connected to your organization." />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_WHATSAPP_ACCOUNTS.view}
        onRowClick={(account) => navigate(account.id)}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={connectDialog.open}
              permission={ORG_WHATSAPP_ACCOUNTS.add}
            >
              Connect account
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: MessageCircle,
          title: 'No WhatsApp accounts yet',
          description: 'Connect a WhatsApp Business Account to send messages from your own number.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={connectDialog.open}
              permission={ORG_WHATSAPP_ACCOUNTS.add}
            >
              Connect account
            </Button>
          ),
        }}
      />

      <Dialog
        handle={connectDialog}
        icon={MessageCircle}
        title="Connect WhatsApp account"
        description="Links a WhatsApp Business Account using a Meta system-user access token."
        content={(close) => <ConnectWhatsappAccountDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
