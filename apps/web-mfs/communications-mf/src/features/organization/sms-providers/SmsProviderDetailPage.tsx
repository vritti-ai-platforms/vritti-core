import { ORG_SMS_PROVIDERS } from '@vritti/communications-permissions/sms-providers';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Typography } from '@vritti/quantum-ui/Typography';
import { MessageSquareText, Pencil } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDeleteSmsProvider, useSmsProvider } from '@/hooks/organization/sms-providers';
import { EditSmsProviderDialog } from './forms/EditSmsProviderDialog';

export const SmsProviderDetailPage = () => {
  const { providerId = '' } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { data: provider } = useSmsProvider(providerId);
  const confirm = useConfirm();
  const editDialog = useDialog();
  const deleteMutation = useDeleteSmsProvider({ onSuccess: () => navigate('..', { relative: 'path' }) });

  const isPlatform = provider.type === 'PLATFORM';

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Remove "${provider.name}"?`,
      description:
        'Vritti forgets this provider and its credentials. Apps configured to send through it will fail until they pick another provider.',
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

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailField
            label="Provider"
            type="string"
            value={<Badge variant="outline">{provider.provider.toLowerCase()}</Badge>}
          />
          <DetailField
            label="Type"
            type="string"
            value={
              isPlatform ? (
                <Badge variant="secondary">Platform — managed by Vritti</Badge>
              ) : (
                <Badge variant="outline">Client — your organization</Badge>
              )
            }
          />
          <DetailField
            label="Status"
            type="string"
            value={
              provider.isActive ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="destructive">Inactive</Badge>
              )
            }
          />
          <DetailField
            label="Credentials"
            type="string"
            value={
              provider.hasCredentials ? (
                <Badge variant="success">Configured</Badge>
              ) : (
                <Badge variant="outline">None required</Badge>
              )
            }
          />
          <DetailField label="Sender ID" type="string" value={provider.senderId ?? '—'} mono />
          <DetailField label="Connected" type="dateTime" value={provider.createdAt} />
          <DetailField label="Last updated" type="dateTime" value={provider.updatedAt} />
        </CardContent>
      </Card>

      {isPlatform ? (
        <Typography variant="body2" intent="muted">
          This sender is managed by Vritti and cannot be changed here.
        </Typography>
      ) : (
        <DangerZone
          title="Remove this provider"
          description="Vritti forgets this provider account and its credentials. Nothing changes at the vendor."
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
