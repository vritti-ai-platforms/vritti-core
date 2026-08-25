import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Star } from 'lucide-react';
import type React from 'react';
import { useUpdateWhatsappAccount } from '@/hooks/organization/whatsapp-accounts';
import type { WhatsappAccountData } from '@/schemas/whatsapp-accounts';

interface OverviewTabProps {
  account: WhatsappAccountData;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ account }) => {
  const updateMutation = useUpdateWhatsappAccount();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Name" type="string" value={account.name} />
          <DetailField
            label="Status"
            type="string"
            value={
              <Badge variant={account.isActive ? 'outline' : 'destructive'}>
                {account.isActive ? 'Connected' : 'Disabled'}
              </Badge>
            }
          />
          <DetailField label="WABA ID" type="string" value={account.wabaId} mono />
          <DetailField label="Business portfolio ID" type="string" value={account.metaBusinessId} mono />
          <DetailField label="Legal entity" type="string" value={account.legalEntityId} mono />
          <DetailField
            label="Default sender"
            type="string"
            value={account.isDefault ? <Badge variant="secondary">Default</Badge> : 'No'}
          />
          <DetailField label="Connected" type="dateTime" value={account.createdAt} />
          <DetailField label="Last updated" type="dateTime" value={account.updatedAt} />
        </div>
      </Card>

      {!account.isDefault && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-medium text-sm">Make this the default sender</span>
              <span className="text-muted-foreground text-sm">
                Messages that do not name an account — including login codes — are sent from the default.
              </span>
            </div>
            <Button
              variant="outline"
              startAdornment={<Star className="size-4" />}
              permission={ORG_WHATSAPP_ACCOUNTS.edit}
              isLoading={updateMutation.isPending}
              onClick={() => updateMutation.mutate({ id: account.id, data: { isDefault: true } })}
            >
              Set as default
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
