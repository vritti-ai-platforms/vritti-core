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
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { Eye, Facebook, MessageCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useEmbeddedSignup,
  useEmbeddedSignupConfig,
  useEmbeddedSignupResult,
  useWhatsappAccounts,
  WHATSAPP_ACCOUNTS_TABLE_KEY,
} from '@/hooks/organization/whatsapp-accounts';
import type { WhatsappAccountData } from '@/schemas/whatsapp-accounts';

export const WhatsappAccountsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useWhatsappAccounts();

  const { data: signupConfig } = useEmbeddedSignupConfig();

  // The flow leaves this page and comes back to it, so the outcome arrives on the query string
  useEmbeddedSignupResult();

  // One launcher. A number already live on the WhatsApp Business app needed its own opt-in on the
  // older flow; on v4 the signup detects that case itself and routes to coexistence, so there is
  // nothing for the operator to choose up front.
  const { open: openSignup, isRunning } = useEmbeddedSignup({ config: signupConfig, mode: 'connect' });

  const signupDisabledTip =
    signupConfig && !signupConfig.enabled ? 'WhatsApp sign-up is not configured for this environment yet.' : undefined;

  // Plain functions, not components: an inline component would be a new type every render and
  // remount the button mid-flight
  const connectButton = (size?: 'sm') => (
    <Button
      size={size}
      startAdornment={<Facebook className="size-4" />}
      permission={ORG_WHATSAPP_ACCOUNTS.add}
      isLoading={isRunning}
      loadingText="Redirecting..."
      disabled={!signupConfig?.enabled}
      disabledTip={signupDisabledTip}
      onClick={openSignup}
    >
      Connect with Facebook
    </Button>
  );

  const columns = useMemo<ColumnDef<WhatsappAccountData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <StringCell value={row.original.name} />,
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
        ]}
        toolbarActions={{ actions: connectButton('sm') }}
        emptyStateConfig={{
          icon: MessageCircle,
          title: 'No WhatsApp accounts yet',
          description:
            'Sign in with Facebook to grant Vritti access to a WhatsApp Business Account — nothing to copy or paste. A number already running on the WhatsApp Business app works too; the signup detects it and connects it in place.',
          action: connectButton(),
        }}
      />
    </div>
  );
};
