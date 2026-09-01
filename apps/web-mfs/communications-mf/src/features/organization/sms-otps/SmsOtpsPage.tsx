import { ORG_SMS_OTPS } from '@vritti/communications-permissions/sms-otps';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { ConfigTab } from './tabs/config/ConfigTab';
import { OtpsTab } from './tabs/otps/OtpsTab';
import { OverviewTab } from './tabs/overview/OverviewTab';

export const SmsOtpsPage = () => (
  <div className="flex flex-col gap-6">
    <PageHeader
      title="SMS OTPs"
      description="One-time codes your apps send over SMS, and whether they were delivered and used."
    />

    <Tabs
      tabs={[
        {
          value: 'overview',
          label: 'Overview',
          permission: ORG_SMS_OTPS.stats.view,
          content: <OverviewTab />,
        },
        {
          value: 'codes',
          label: 'Codes',
          permission: ORG_SMS_OTPS.view,
          content: <OtpsTab />,
        },
        {
          value: 'config',
          label: 'Configuration',
          permission: ORG_SMS_OTPS.configuredApps.view,
          content: <ConfigTab />,
        },
      ]}
    />
  </div>
);
