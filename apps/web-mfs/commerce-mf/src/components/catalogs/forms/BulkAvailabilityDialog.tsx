import { Button } from '@vritti/quantum-ui/Button';
import { Checkbox } from '@vritti/quantum-ui/Checkbox';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import type React from 'react';
import { useState } from 'react';
import { type CatalogChannelData, CHANNEL_TYPE_META } from '@/schemas/catalog-channels';
import type { CatalogsBinding } from '../bindings';
import { channelLabel } from './ManageVisibilityDialog';

interface BulkAvailabilityDialogProps {
  binding: CatalogsBinding;
  catalogId: string;
  ids: string[];
  channels: CatalogChannelData[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const BulkAvailabilityDialog: React.FC<BulkAvailabilityDialogProps> = ({
  binding,
  catalogId,
  ids,
  channels,
  onSuccess,
  onCancel,
}) => {
  const ownChannels = channels.filter((channel) => channel.isOwn);
  const [selected, setSelected] = useState<string[]>([]);
  const availabilityMutation = binding.useBulkSetListingAvailability({ onSuccess });

  const toggle = (channelId: string) =>
    setSelected((current) =>
      current.includes(channelId) ? current.filter((id) => id !== channelId) : [...current, channelId],
    );

  const apply = (visible: boolean) => availabilityMutation.mutate({ catalogId, ids, channelIds: selected, visible });

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {ownChannels.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {channels.length === 0
              ? 'This catalog is not assigned to any channel yet, so nothing shows from it. Assign it on the Catalog Channels page.'
              : 'Every channel carrying this catalog belongs to a wider scope. Switch to the workspace that owns them to change what they carry.'}
          </p>
        ) : (
          <>
            <p className="mb-4 text-muted-foreground text-sm">
              Pick the channels, then say whether the {pluralize('selected listing', ids.length, true)} should show
              there. Listings keep their own per-currency exclusions, which the Prices tab manages.
            </p>
            <div className="flex flex-col divide-y">
              {ownChannels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{channelLabel(channel)}</div>
                    <div className="text-muted-foreground text-xs">{CHANNEL_TYPE_META[channel.type].description}</div>
                  </div>
                  <Checkbox
                    checked={selected.includes(channel.id)}
                    onCheckedChange={() => toggle(channel.id)}
                    aria-label={channelLabel(channel)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          permission={binding.permissions.listings.setAvailability}
          disabled={selected.length === 0}
          disabledTip="Pick at least one channel."
          isLoading={availabilityMutation.isPending}
          onClick={() => apply(false)}
        >
          Exclude
        </Button>
        <Button
          type="button"
          permission={binding.permissions.listings.setAvailability}
          disabled={selected.length === 0}
          disabledTip="Pick at least one channel."
          isLoading={availabilityMutation.isPending}
          onClick={() => apply(true)}
        >
          Make available
        </Button>
      </DialogActions>
    </>
  );
};
