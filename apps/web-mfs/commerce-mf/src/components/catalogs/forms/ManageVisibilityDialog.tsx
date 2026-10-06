import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import type React from 'react';
import { type CatalogChannelData, CHANNEL_TYPE_META } from '@/schemas/catalog-channels';
import type { CatalogListingData } from '@/schemas/catalogs';
import type { CatalogsBinding } from '../bindings';

// The channel's type plus whatever narrows it — a named terminal, or the level that owns it
export const channelLabel = (channel: CatalogChannelData) => {
  const type = CHANNEL_TYPE_META[channel.type].label;
  if (channel.terminalName) return `${type} · ${channel.terminalName}`;
  if (channel.siteId) return `${type} · outlet`;
  if (channel.legalEntityId) return `${type} · company`;
  return type;
};

interface ManageVisibilityDialogProps {
  binding: CatalogsBinding;
  catalogId: string;
  listing: CatalogListingData;
  channels: CatalogChannelData[];
  onClose: () => void;
}

export const ManageVisibilityDialog: React.FC<ManageVisibilityDialogProps> = ({
  binding,
  catalogId,
  listing,
  channels,
  onClose,
}) => {
  const visibilityMutation = binding.useSetListingChannelVisibility();

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {channels.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            This catalog is not assigned to any channel yet, so nothing shows from it. Assign it on the Catalog Channels
            page.
          </p>
        ) : (
          <div className="flex flex-col divide-y">
            {channels.map((channel) => {
              const locked = !channel.isOwn;
              return (
                <div key={channel.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{channelLabel(channel)}</div>
                    <div className="text-muted-foreground text-xs">
                      {locked
                        ? 'Owned by a wider scope — change it in the workspace that owns it'
                        : CHANNEL_TYPE_META[channel.type].description}
                    </div>
                  </div>
                  <StatusSwitch
                    checked={!listing.hiddenChannelIds.includes(channel.id)}
                    activeLabel="Visible"
                    inactiveLabel="Hidden"
                    permission={binding.permissions.listings.edit}
                    disabled={locked}
                    disabledTip="This channel belongs to a wider scope — change it in the workspace that owns it."
                    isLoading={visibilityMutation.isPending}
                    onCheckedChange={(visible) =>
                      visibilityMutation.mutate({ catalogId, listingId: listing.id, channelId: channel.id, visible })
                    }
                    ariaLabel={`Show ${listing.sku ?? 'this listing'} on ${channelLabel(channel)}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DialogActions>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </>
  );
};
