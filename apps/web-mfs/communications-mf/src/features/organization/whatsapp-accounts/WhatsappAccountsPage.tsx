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
import { SelectFilter } from '@vritti/quantum-ui/Select';
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
          // inline-flex so the group flows within the cell's text-center like every other column;
          // a block flex would pack left and break column alignment
          <span className="inline-flex items-center gap-2">
            <StringCell value={row.original.name} />
            {row.original.isDefault && <Badge variant="secondary">Default</Badge>}
          </span>
        ),
        enableSorting: true,
        size: 240,
      },
      {
        accessorKey: 'wabaId',
        header: 'WABA ID',
        cell: ({ row }) => <StringCell value={row.original.wabaId} mono />,
        enableSorting: true,
        size: 180,
      },
      {
        accessorKey: 'metaBusinessId',
        header: 'Business portfolio',
        cell: ({ row }) => <StringCell value={row.original.metaBusinessId} mono />,
        enableSorting: true,
        size: 180,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'destructive'}>
            {row.original.isActive ? 'Connected' : 'Disabled'}
          </Badge>
        ),
        enableSorting: true,
        size: 110,
      },
      {
        accessorKey: 'createdAt',
        header: 'Connected',
        cell: ({ row }) => <DateTimeCell value={row.original.createdAt} />,
        enableSorting: true,
        size: 160,
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
                permission: ORG_WHATSAPP_ACCOUNTS.view,
                onClick: () => navigate(row.original.id),
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
    slug: 'communications-org-whatsapp-accounts',
    label: 'WhatsApp account',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
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
        searchConfig={{
          columns: [
            { id: 'name', label: 'Name' },
            { id: 'wabaId', label: 'WABA ID' },
            { id: 'metaBusinessId', label: 'Business ID' },
          ],
          searchAll: true,
        }}
        filters={[
          <SelectFilter
            key="isActive"
            name="isActive"
            label="Status"
            options={[
              { label: 'Connected', value: 'true' },
              { label: 'Disabled', value: 'false' },
            ]}
          />,
          <SelectFilter
            key="isDefault"
            name="isDefault"
            label="Default sender"
            options={[
              { label: 'Default', value: 'true' },
              { label: 'Not default', value: 'false' },
            ]}
          />,
        ]}
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
