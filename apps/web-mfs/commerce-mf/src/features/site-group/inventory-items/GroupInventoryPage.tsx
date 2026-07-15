import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Boxes } from 'lucide-react';
import { useState } from 'react';
import { AvailabilityTab } from './tabs/AvailabilityTab';
import { LevelsTab } from './tabs/LevelsTab';

// No current-site-group context exists in this MF yet, so the selection starts empty.
// The query hooks are enabled-guarded on siteIds.length > 0.
const siteIds: string[] = [];

export const GroupInventoryPage = () => {
  const [activeTab, setActiveTab] = useState('availability');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Group Inventory"
        description="Read-only inventory availability and stock levels across the sites in this group."
      />

      {siteIds.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border bg-card text-center">
          <Boxes className="size-8 text-muted-foreground" />
          <div className="text-sm font-medium">Select sites to view group inventory</div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Choose one or more sites in this group to see item availability and stock levels.
          </p>
        </div>
      ) : (
        <Tabs
          tabs={[
            {
              value: 'availability',
              label: 'Availability',
              content: <AvailabilityTab siteIds={siteIds} />,
            },
            {
              value: 'levels',
              label: 'Levels',
              content: <LevelsTab siteIds={siteIds} />,
            },
          ]}
          value={activeTab}
          onValueChange={setActiveTab}
        />
      )}
    </div>
  );
};
