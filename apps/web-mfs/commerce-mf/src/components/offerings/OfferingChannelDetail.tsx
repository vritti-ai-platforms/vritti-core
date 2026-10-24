import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import type React from 'react';
import { useParams } from 'react-router-dom';
import type { OfferingsBinding } from './bindings';
import { ChannelVariants } from './components/ChannelVariants';

interface OfferingChannelDetailProps {
  binding: OfferingsBinding;
}

// One channel's view of one offering, at its own URL.
//
// A route rather than a panel inside the tab: the table below it is a server-state table with its own saved
// view, filters and page, and none of that can be linked to or restored from a reload if the only thing
// holding the chosen channel is component state.
export const OfferingChannelDetail: React.FC<OfferingChannelDetailProps> = ({ binding }) => {
  const { slug, targetSlug } = useSlugParams('slug', 'targetSlug');
  // The channel and the kind ride in the path, so this page resolves nothing to know which row it is: an app
  // is a target of two channel types, so the target alone would not say which channel it writes against.
  const { channelId = '', targetKind = 'APP' } = useParams<{ channelId: string; targetKind: 'APP' | 'TERMINAL' }>();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6">
      <PageHeader title={targetSlug.name} description={`What this channel carries of ${slug.name}.`} />

      <ChannelVariants
        offeringId={slug.id}
        channelId={channelId}
        targetId={targetSlug.id}
        targetKind={targetKind}
        permissions={binding.permissions}
        useChannelVariantsTable={binding.useChannelVariantsTable}
        useCreateChannelPages={binding.useCreateChannelPages}
        useSetTargetAvailability={binding.useSetTargetAvailability}
        variantsKey={binding.channelVariantsKey}
        variantsSlug={binding.channelVariantsSlug}
      />
    </div>
  );
};
