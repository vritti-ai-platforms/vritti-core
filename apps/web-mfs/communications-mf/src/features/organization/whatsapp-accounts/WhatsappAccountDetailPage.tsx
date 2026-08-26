import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useDeleteWhatsappAccount,
  useUpdateWhatsappAccount,
  useWhatsappAccount,
} from '@/hooks/organization/whatsapp-accounts';
import { OverviewTab } from './tabs/overview/OverviewTab';

export const WhatsappAccountDetailPage = () => {
  const { accountId = '' } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { data: account } = useWhatsappAccount(accountId);
  const confirm = useConfirm();
  const updateMutation = useUpdateWhatsappAccount();
  // Two segments up: the active tab is part of the path, so `..` alone would only land back here
  const deleteMutation = useDeleteWhatsappAccount({ onSuccess: () => navigate('../..', { relative: 'path' }) });

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Disconnect "${account.name}"?`,
      description:
        'Vritti stops sending from this WhatsApp Business Account and forgets its access token. The account itself is untouched in Meta and can be reconnected.',
      confirmLabel: 'Disconnect',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(account.id);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={account.name}
        description={`WABA ${account.wabaId}`}
        actions={
          !account.isDefault && (
            <Button
              variant="outline"
              startAdornment={<Star className="size-4" />}
              permission={ORG_WHATSAPP_ACCOUNTS.edit}
              isLoading={updateMutation.isPending}
              onClick={() => updateMutation.mutate({ id: account.id, data: { isDefault: true } })}
            >
              Set as default
            </Button>
          )
        }
      />

      <Tabs
        // The tab is a path segment, not a search param: Breadcrumb links carry the pathname only, so a
        // `?tab=` would be dropped the moment a crumb is clicked
        routeParam="accountTab"
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: ORG_WHATSAPP_ACCOUNTS.view,
            content: <OverviewTab account={account} />,
          },
        ]}
      />

      <DangerZone
        title="Disconnect this account"
        description="Vritti stops sending from this WhatsApp Business Account and forgets its access token. Nothing is deleted in Meta."
        buttonText="Disconnect Account"
        permission={ORG_WHATSAPP_ACCOUNTS.delete}
        onClick={handleDelete}
      />
    </div>
  );
};
