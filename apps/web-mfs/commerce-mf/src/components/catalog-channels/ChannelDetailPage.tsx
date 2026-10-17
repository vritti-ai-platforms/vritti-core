import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import type React from 'react';
import type { CatalogChannelsBinding } from './bindings';
import { CurrenciesTab } from './tabs/CurrenciesTab';
import { ListingsTab } from './tabs/ListingsTab';

interface ChannelDetailPageProps {
  binding: CatalogChannelsBinding;
}

// What one channel offers: the items it carries, and what it charges in each currency
export const ChannelDetailPage: React.FC<ChannelDetailPageProps> = ({ binding }) => {
  const { id: channelId } = useSlugParams('slug');

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6">
      <PageHeader
        title="Channel items"
        description="Everything this channel's catalog holds, what it offers, and what it charges."
      />

      <Tabs
        routeParam="tab"
        tabs={[
          {
            value: 'listings',
            label: 'Listings',
            permission: binding.permissions.listings,
            content: <ListingsTab binding={binding} channelId={channelId} />,
          },
          {
            value: 'currencies',
            label: 'Currencies',
            permission: binding.permissions.prices,
            content: <CurrenciesTab binding={binding} channelId={channelId} />,
          },
        ]}
      />
    </div>
  );
};
