import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Route } from 'lucide-react';
import type React from 'react';
import { type CatalogChannelData, CHANNEL_TYPE_META } from '@/schemas/catalog-channels';
import type { CatalogsBinding } from '../bindings';

interface ChannelsTabProps {
  binding: CatalogsBinding;
  catalogId: string;
}

const scopeLabel = (row: CatalogChannelData) =>
  row.siteId ? 'One outlet' : row.legalEntityId ? 'One company' : 'Whole organization';

const targetLabel = (row: CatalogChannelData) => {
  if (row.terminalId) return row.terminalName ?? 'One terminal';
  if (row.appId) return 'One app';
  return CHANNEL_TYPE_META[row.type].slotLabel;
};

// Mirrors one channel row: the type badge, the target it names and the scope under it
const ChannelRowSkeleton: React.FC = () => (
  <Card>
    <CardContent className="flex items-center gap-3 py-4">
      <Skeleton className="h-5 w-16 rounded-md" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </CardContent>
  </Card>
);

// Read-only — bindings are created and repointed on the Catalog Channels page
export const ChannelsTab: React.FC<ChannelsTabProps> = ({ binding, catalogId }) => {
  const { data: channels = [], isLoading } = binding.useChannelsForCatalog(catalogId);

  // Built from the same Card the rows are, so the placeholder is their height by construction rather
  // than by a number picked to look about right
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <ChannelRowSkeleton />
        <ChannelRowSkeleton />
        <Skeleton className="h-4 w-80" />
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <Empty
        icon={<Route className="size-5" />}
        title="Not reachable"
        description="No channel carries this catalog yet, so nothing in it can be bought. Bind one on the Catalog Channels page."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {channels.map((channel) => (
        <Card key={channel.id}>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{CHANNEL_TYPE_META[channel.type].label}</Badge>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{targetLabel(channel)}</span>
                <span className="text-muted-foreground text-xs">{scopeLabel(channel)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <p className="text-muted-foreground text-xs">
        Channels are managed on the Catalog Channels page — repointing one there takes effect immediately.
      </p>
    </div>
  );
};
