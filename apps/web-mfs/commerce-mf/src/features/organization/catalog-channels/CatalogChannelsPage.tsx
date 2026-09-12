import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { cn } from '@vritti/quantum-ui/cn';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { ChevronRight, Monitor, Receipt, Route, Smartphone } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type CatalogChannelType,
  CHANNEL_TYPE_META,
  type ChannelOverviewData,
  SCOPE_LABEL,
} from '@/schemas/catalog-channels';
import type { CatalogChannelsBinding } from './types';

const TYPE_ICON: Record<CatalogChannelType, React.ElementType> = {
  APP: Smartphone,
  POS: Monitor,
  B2B: Receipt,
};

// Only App is built; the others are shown so the shape of the feature is visible
const LIVE_TYPES: CatalogChannelType[] = ['APP'];

interface CatalogChannelsPageProps {
  binding: CatalogChannelsBinding;
}

export const CatalogChannelsPage: React.FC<CatalogChannelsPageProps> = ({ binding }) => {
  const navigate = useNavigate();
  const { data: channels = [], isLoading } = binding.useOverview();

  // Where the catalog came from only tells you something when it is not this workspace's own
  const provenanceOf = (channel: ChannelOverviewData) => {
    if (!channel.catalogName) return <span className="text-warning text-xs">Nothing assigned</span>;
    if (!channel.isOverride) {
      return (
        <span className="text-muted-foreground text-xs">
          Inherited from the {SCOPE_LABEL[channel.inheritedFrom ?? 'ORGANIZATION']}
        </span>
      );
    }
    if (binding.scopeSegment === 'org') return null;
    return <span className="text-muted-foreground text-xs">Overridden for this {binding.scopeNoun}</span>;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Catalog Channels" description={binding.description} />

      {!isLoading && channels.length === 0 ? (
        <Empty icon={<Route className="size-5" />} title="No channels" description="Nothing to configure here yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {channels.map((channel) => {
            const meta = CHANNEL_TYPE_META[channel.type];
            const Icon = TYPE_ICON[channel.type];
            const isLive = LIVE_TYPES.includes(channel.type);
            return (
              <Card
                key={channel.type}
                className={cn(isLive && 'cursor-pointer transition-colors hover:border-primary/40')}
                onClick={isLive ? () => navigate(channel.type.toLowerCase()) : undefined}
              >
                <CardContent className="flex h-full flex-col gap-3 py-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon className="size-5 text-muted-foreground" />
                      <span className="font-semibold">{meta.label}</span>
                    </div>
                    {isLive ? <ChevronRight className="size-4 text-muted-foreground" /> : null}
                  </div>

                  <p className="text-muted-foreground text-xs">{meta.description}</p>

                  <div className="mt-auto flex flex-col items-start gap-1.5 pt-2">
                    {isLive ? (
                      <>
                        {channel.catalogName ? (
                          <span className="font-medium text-sm">{channel.catalogName}</span>
                        ) : null}
                        {provenanceOf(channel)}
                      </>
                    ) : (
                      <span className="text-muted-foreground text-xs">Coming soon</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
