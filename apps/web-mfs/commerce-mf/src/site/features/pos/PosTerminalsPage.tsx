import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { PosTerminalsTab } from './tabs/PosTerminalsTab';

export const PosTerminalsPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="POS Terminals" description="Manage billing terminals and linked POS storage locations" />
      <PosTerminalsTab />
    </div>
  );
};
