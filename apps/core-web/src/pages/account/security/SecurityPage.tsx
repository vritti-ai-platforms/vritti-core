import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import type { TabItem } from '@vritti/quantum-ui/Tabs';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { ChangePasswordTab } from './tabs/ChangePasswordTab';
import { SessionsTab } from './tabs/SessionsTab';

const tabs: TabItem[] = [
  { value: 'password', label: 'Password', content: <ChangePasswordTab /> },
  { value: 'sessions', label: 'Sessions', content: <SessionsTab /> },
];

export const SecurityPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader title="Security" description="Manage your password and active sessions" />
    <Tabs tabs={tabs} defaultValue="password" />
  </div>
);
