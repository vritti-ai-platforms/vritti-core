import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type { WhatsappAccountData } from '@/schemas/whatsapp-accounts';

interface OverviewTabProps {
  account: WhatsappAccountData;
}

export const OverviewTab = ({ account }: OverviewTabProps) => (
  <div className="flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <DetailField
          label="Status"
          type="string"
          value={
            <Badge variant={account.isActive ? 'success' : 'destructive'}>
              {account.isActive ? 'Connected' : 'Disabled'}
            </Badge>
          }
        />
        <DetailField
          label="Default sender"
          type="string"
          value={
            account.isDefault ? (
              <Badge variant="secondary">Default</Badge>
            ) : (
              <Badge variant="outline">Not default</Badge>
            )
          }
        />
        <DetailField
          label="Webhooks"
          type="string"
          value={
            account.webhooksSubscribed ? (
              <Badge variant="success">Subscribed</Badge>
            ) : (
              <Badge variant="destructive">Not subscribed</Badge>
            )
          }
        />
        <DetailField label="WABA ID" type="string" value={account.wabaId} mono />
        <DetailField label="Business portfolio ID" type="string" value={account.metaBusinessId} mono />
        <DetailField label="Connected" type="dateTime" value={account.createdAt} />
        <DetailField label="Last updated" type="dateTime" value={account.updatedAt} />
      </CardContent>
    </Card>
  </div>
);
