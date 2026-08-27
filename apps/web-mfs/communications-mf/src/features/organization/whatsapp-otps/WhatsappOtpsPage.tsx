import { ORG_WHATSAPP_OTPS } from '@vritti/communications-permissions/whatsapp-otps';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { ConfigTab } from './tabs/config/ConfigTab';
import { OtpsTab } from './tabs/otps/OtpsTab';
import { OverviewTab } from './tabs/overview/OverviewTab';

export const WhatsappOtpsPage = () => (
  <div className="flex flex-col gap-6">
    <PageHeader
      title="WhatsApp OTPs"
      description="One-time codes your apps send over WhatsApp, and whether they were delivered and used."
    />

    <Tabs
      tabs={[
        {
          value: 'overview',
          label: 'Overview',
          permission: ORG_WHATSAPP_OTPS.stats.view,
          content: <OverviewTab />,
        },
        {
          value: 'codes',
          label: 'Codes',
          permission: ORG_WHATSAPP_OTPS.view,
          content: <OtpsTab />,
        },
        {
          value: 'config',
          label: 'Configuration',
          permission: ORG_WHATSAPP_OTPS.configuredApps.view,
          content: <ConfigTab />,
        },
      ]}
    />
  </div>
);
