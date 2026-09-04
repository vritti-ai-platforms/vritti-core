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
import { Eye, Facebook, MessageCircle, Smartphone } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useConnectWhatsappAccountEmbedded,
  useEmbeddedSignup,
  useEmbeddedSignupConfig,
  useWhatsappAccounts,
  WHATSAPP_ACCOUNTS_TABLE_KEY,
} from '@/hooks/organization/whatsapp-accounts';
import type { WhatsappAccountData } from '@/schemas/whatsapp-accounts';

export const WhatsappAccountsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useWhatsappAccounts();

  const { data: signupConfig } = useEmbeddedSignupConfig();
  const connectMutation = useConnectWhatsappAccountEmbedded();

  // Two launchers over one mutation. The default flow refuses a number already live on the WhatsApp
  // Business app, and only the coexistence flag takes one — Meta decides eligibility on its own
  // screen, so the choice has to be the operator's, made before the popup opens.
  const { open: openSignup, isOpening } = useEmbeddedSignup({
    config: signupConfig,
    onComplete: connectMutation.mutate,
  });
  const { open: openCoexistence, isOpening: isOpeningCoexistence } = useEmbeddedSignup({
    config: signupConfig,
    onComplete: connectMutation.mutate,
    featureType: 'whatsapp_business_app_onboarding',
  });

  const signupDisabledTip =
    signupConfig && !signupConfig.enabled ? 'WhatsApp sign-up is not configured for this environment yet.' : undefined;

  // Plain functions, not components: an inline component would be a new type every render and
  // remount the button mid-flight
  const connectButton = (size?: 'sm') => (
    <Button
      size={size}
      startAdornment={<Facebook className="size-4" />}
      permission={ORG_WHATSAPP_ACCOUNTS.add}
      isLoading={isOpening || connectMutation.isPending}
      loadingText="Connecting..."
      disabled={!signupConfig?.enabled}
      disabledTip={signupDisabledTip}
      onClick={openSignup}
    >
      Connect with Facebook
    </Button>
  );

  const coexistenceButton = (size?: 'sm') => (
    <Button
      size={size}
      variant="outline"
      startAdornment={<Smartphone className="size-4" />}
      permission={ORG_WHATSAPP_ACCOUNTS.add}
      isLoading={isOpeningCoexistence}
      loadingText="Connecting..."
      disabled={!signupConfig?.enabled}
      disabledTip={signupDisabledTip}
      onClick={openCoexistence}
    >
      Use an existing number
    </Button>
  );

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
            <>
              {coexistenceButton('sm')}
              {connectButton('sm')}
            </>
          ),
        }}
        emptyStateConfig={{
          icon: MessageCircle,
          title: 'No WhatsApp accounts yet',
          description:
            'Sign in with Facebook to grant Vritti access to a WhatsApp Business Account — nothing to copy or paste. Already running WhatsApp Business on the number you want? Pick "Use an existing number".',
          action: (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {connectButton()}
              {coexistenceButton()}
            </div>
          ),
        }}
      />
    </div>
  );
};
