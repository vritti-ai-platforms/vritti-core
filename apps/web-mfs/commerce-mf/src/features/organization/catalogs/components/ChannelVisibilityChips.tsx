import { cn } from '@vritti/quantum-ui/cn';
import type React from 'react';
import { useSetCatalogListingChannelVisibility } from '@/hooks/organization/catalogs';
import { type CatalogChannelData, CHANNEL_TYPE_META } from '@/schemas/catalog-channels';

interface ChannelVisibilityChipsProps {
  catalogId: string;
  listingId: string;
  channels: CatalogChannelData[];
  hiddenChannelIds: string[];
  disabled?: boolean;
}

const chipLabel = (channel: CatalogChannelData) => {
  const type = CHANNEL_TYPE_META[channel.type].label;
  if (channel.terminalName) return `${type} · ${channel.terminalName}`;
  if (channel.siteId) return `${type} · outlet`;
  if (channel.legalEntityId) return `${type} · company`;
  return type;
};

// A listing sells on every channel of its catalog unless switched off, so only the exceptions are stored
export const ChannelVisibilityChips: React.FC<ChannelVisibilityChipsProps> = ({
  catalogId,
  listingId,
  channels,
  hiddenChannelIds,
  disabled,
}) => {
  const visibilityMutation = useSetCatalogListingChannelVisibility();

  if (channels.length === 0) return <span className="text-muted-foreground text-xs">No channels</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {channels.map((channel) => {
        const visible = !hiddenChannelIds.includes(channel.id);
        return (
          <button
            key={channel.id}
            type="button"
            disabled={disabled || visibilityMutation.isPending}
            onClick={() =>
              visibilityMutation.mutate({ catalogId, listingId, channelId: channel.id, visible: !visible })
            }
            className={cn(
              'rounded-full border px-2.5 py-0.5 font-medium text-xs transition-colors disabled:opacity-60',
              visible
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground line-through',
            )}
            aria-pressed={visible}
          >
            {chipLabel(channel)}
          </button>
        );
      })}
    </div>
  );
};
