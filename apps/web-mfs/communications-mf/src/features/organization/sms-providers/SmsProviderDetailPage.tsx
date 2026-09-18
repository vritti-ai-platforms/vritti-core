import { ORG_SMS_PROVIDERS } from '@vritti/communications-permissions/sms-providers';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { MessageSquareText, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeleteSmsProvider, useSmsProvider } from '@/hooks/organization/sms-providers';
import { EditSmsProviderDialog } from './forms/EditSmsProviderDialog';
import { OverviewTab } from './tabs/overview/OverviewTab';
import { TemplatesTab } from './tabs/templates/TemplatesTab';

export const SmsProviderDetailPage = () => {
  const { id } = useSlugParams('slug');
  const navigate = useNavigate();
  const { data: provider } = useSmsProvider(id);
  const confirm = useConfirm();
  const editDialog = useDialog();
  const deleteMutation = useDeleteSmsProvider({ onSuccess: () => navigate('..', { relative: 'path' }) });

  const isPlatform = provider.type === 'PLATFORM';

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Remove "${provider.name}"?`,
      description:
        'Vritti forgets this provider, its credentials, and the templates registered against it. Apps configured to send through it will fail until they pick another provider. Nothing changes at the vendor.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(provider.id);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={provider.name}
        description={isPlatform ? 'Platform sender managed by Vritti' : 'Your SMS provider account'}
        actions={
          !isPlatform && (
            <Button
              variant="outline"
              startAdornment={<Pencil className="size-4" />}
              permission={ORG_SMS_PROVIDERS.edit}
              onClick={editDialog.open}
            >
              Edit
            </Button>
          )
        }
      />

      <Tabs
        routeParam="tab"
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: ORG_SMS_PROVIDERS.view,
            content: <OverviewTab provider={provider} />,
          },
          {
            value: 'templates',
            label: 'Templates',
            permission: ORG_SMS_PROVIDERS.templates.view,
            content: <TemplatesTab provider={provider} />,
          },
        ]}
      />

      {!isPlatform && (
        <DangerZone
          title="Remove this provider"
          description="Vritti forgets this provider account, its credentials, and its templates. Nothing changes at the vendor."
          buttonText="Remove Provider"
          permission={ORG_SMS_PROVIDERS.delete}
          onClick={handleDelete}
        />
      )}

      <Dialog
        handle={editDialog}
        icon={MessageSquareText}
        title="Edit SMS provider"
        description="Update the name, sender ID, or replace the stored credentials."
        content={(close) => <EditSmsProviderDialog provider={provider} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
