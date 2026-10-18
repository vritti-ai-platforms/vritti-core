import { DangerZoneSkeleton } from '@vritti/quantum-ui/DangerZone';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';
import type React from 'react';

// Shaped from the page it stands in for: a header carrying a status badge and the Edit button, four
// tabs — Overview, Channels, Listings, Currencies — and the delete card under them. The content block
// is the height of the Overview tab, which is what the page opens on: two cards of detail fields,
// not the 500px a table tab would need.
export const CatalogDetailPageSkeleton: React.FC = () => (
  <div className="flex h-full min-h-0 flex-1 flex-col gap-6">
    <PageHeaderSkeleton showDescription showActions />

    <TabsSkeleton count={4} tabWidths={['w-20', 'w-20', 'w-20', 'w-24']} contentHeight="264px" />

    {/* The warning shows whenever a catalog still holds listings or belongs to a wider workspace,
        which is the usual case — a catalog with nothing in it is the exception. */}
    <DangerZoneSkeleton showWarning />
  </div>
);
