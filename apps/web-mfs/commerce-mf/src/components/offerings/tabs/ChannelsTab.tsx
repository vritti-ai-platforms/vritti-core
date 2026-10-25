import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Typography } from '@vritti/quantum-ui/Typography';
import { ChevronRight, Store } from 'lucide-react';
import type React from 'react';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { OfferingChannelTargetData, OfferingChannelTypeData } from '@/schemas/offerings';
import type { UseOfferingChannels } from '../types';

const CHANNEL_TYPE: Record<OfferingChannelTypeData['type'], { label: string; description: string }> = {
  APP: { label: 'App', description: 'Storefronts and integrations calling the SDK' },
  POS: { label: 'POS', description: 'Billing terminals at your outlets' },
  B2B: { label: 'B2B', description: 'Wholesale sites, for buyers that are companies' },
};

interface ChannelsTabProps {
  offeringId: string;
  useOfferingChannels: UseOfferingChannels;
}

// Where this offering sells, grouped the way the channels screen groups it: a card per channel type, and
// under it the apps or tills that carry this offering. A target is always one app or one till — never a
// catch-all — because each one resolves to its own channel, so everything said about a row is unambiguous.
// Targets whose catalog carries none of this offering are left out; there is nothing to say about them.
export const ChannelsTab: React.FC<ChannelsTabProps> = ({ offeringId, useOfferingChannels }) => {
  const { data: types = [], isLoading } = useOfferingChannels(offeringId);
  const navigate = useNavigate();
  const { tab } = useParams();

  // The tab segment is part of the current path, so it is stepped over on the way to a sibling route
  const goToTarget = useCallback(
    (type: OfferingChannelTypeData['type'], target: OfferingChannelTargetData) => {
      // One segment, so the trail gains one crumb reading the target's name. The channel type rides in the
      // slug's id part because an app is a target of two types; the channel itself is derived from the pair.
      const to = `channels/${buildSlug(target.name, `${type}.${target.targetId}`)}`;
      navigate(tab ? `../${to}` : to, { relative: 'path' });
    },
    [navigate, tab],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (types.length === 0) {
    return <Empty icon={<Store />} title="No channels yet" description="This Offering is not listed in any channel" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {types.map((entry) => (
        <Card key={entry.type}>
          <CardHeader>
            <CardTitle>{CHANNEL_TYPE[entry.type].label}</CardTitle>
            <Typography variant="body2" intent="muted">
              {CHANNEL_TYPE[entry.type].description}
            </Typography>
          </CardHeader>
          <CardContent className="grid grid-cols-[repeat(auto-fill,minmax(19rem,1fr))] gap-3">
            {entry.targets.map((target) => (
              <button
                key={target.targetId}
                type="button"
                onClick={() => goToTarget(entry.type, target)}
                className="flex items-center justify-between gap-4 rounded-lg border p-4 text-left hover:bg-muted/50"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="truncate">{target.name}</span>
                    {/* An inherited target is read-only here, so the row says so before it is opened */}
                    {target.isAssigned ? null : <Badge variant="secondary">Inherited</Badge>}
                  </span>
                  <Typography variant="body2" intent="muted">
                    <Counts target={target} />
                  </Typography>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const Counts: React.FC<{ target: OfferingChannelTargetData }> = ({ target }) => {
  const excluded = target.listed - target.available;
  return (
    <>
      {`${target.catalogName} · ${target.listed} of ${pluralize('variant', target.variants, true)}`}
      {excluded > 0 ? `, ${excluded} excluded` : ''}
    </>
  );
};
