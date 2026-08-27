import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Card } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Empty } from '@vritti/quantum-ui/Empty';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Settings2 } from 'lucide-react';
import { useConfiguredOtpApps } from '@/hooks/organization/whatsapp-otps';
import { ConfigTabSkeleton } from './ConfigTabSkeleton';

export const ConfigTab = () => {
  const { data: apps, isLoading } = useConfiguredOtpApps();

  if (isLoading) return <ConfigTabSkeleton />;

  if (!apps?.length) {
    return (
      <Empty
        icon={<Settings2 className="size-8 text-muted-foreground" />}
        title="No apps send OTPs"
        description="Configure an app in Vritti Cloud to let it send WhatsApp OTPs."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert
        variant="info"
        title="Configured in Vritti Cloud"
        description="Which sender and template an app uses is part of the app credential, so it is edited in Vritti Cloud alongside the credential's permissions."
      />

      <p className="text-sm text-muted-foreground">{pluralize('app', apps.length, true)} configured to send OTPs.</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {apps.map((app) => (
          <Card key={app.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{app.name}</span>
              <Badge variant={app.isActive ? 'success' : 'destructive'}>{app.isActive ? 'Active' : 'Suspended'}</Badge>
            </div>
            <DetailField label="Type" type="string" value={app.type} />
            <DetailField label="Template" type="string" value={app.templateName} mono />
            <DetailField label="Code lifetime" type="string" value={`${app.expirySeconds}s`} />
          </Card>
        ))}
      </div>
    </div>
  );
};
