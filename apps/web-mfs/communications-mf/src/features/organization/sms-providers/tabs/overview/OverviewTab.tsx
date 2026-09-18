import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Typography } from '@vritti/quantum-ui/Typography';
import type { SmsProviderData } from '@/schemas/sms-providers';

interface OverviewTabProps {
  provider: SmsProviderData;
}

export const OverviewTab = ({ provider }: OverviewTabProps) => {
  const isPlatform = provider.type === 'PLATFORM';

  return (
    <div className="flex flex-col gap-6">
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

      {isPlatform && (
        <Typography variant="body2" intent="muted">
          This sender is managed by Vritti and cannot be changed here.
        </Typography>
      )}
    </div>
  );
};
