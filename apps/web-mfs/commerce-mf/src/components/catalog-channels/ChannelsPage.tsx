import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import type React from 'react';
import type { CatalogChannelsBinding } from './bindings';
import { ChannelCard } from './ChannelCard';

interface ChannelsPageProps {
  binding: CatalogChannelsBinding;
}

// The channels list: one card per channel type
export const ChannelsPage: React.FC<ChannelsPageProps> = ({ binding }) => {
  const { data: entries } = binding.useCatalogChannels();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catalog Channels"
        description="Which catalog each selling surface uses. A level with nothing set uses the one above it."
      />

      {/* The channel types are fixed, so there is always one card each — no empty state to show */}
      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <ChannelCard key={entry.type} binding={binding} entry={entry} />
        ))}
      </div>
    </div>
  );
};
