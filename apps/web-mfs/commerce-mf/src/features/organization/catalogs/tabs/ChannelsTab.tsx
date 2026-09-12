import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Route } from 'lucide-react';
import type React from 'react';
import { useCatalogChannelsForCatalog } from '@/hooks/organization/catalog-channels';
import { type CatalogChannelData, CHANNEL_TYPE_META } from '@/schemas/catalog-channels';

interface ChannelsTabProps {
  catalogId: string;
}

const scopeLabel = (row: CatalogChannelData) =>
  row.siteId ? 'One outlet' : row.legalEntityId ? 'One company' : 'Whole organization';

const targetLabel = (row: CatalogChannelData) => {
  if (row.terminalId) return row.terminalName ?? 'One till';
  if (row.appId) return 'One app';
  return row.type === 'POS' ? 'Any till' : 'Any app';
};

// Read-only — bindings are created and repointed on the Catalog Channels page
export const ChannelsTab: React.FC<ChannelsTabProps> = ({ catalogId }) => {
  const { data: channels = [], isLoading } = useCatalogChannelsForCatalog(catalogId);

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading channels…</div>;

  if (channels.length === 0) {
    return (
      <Empty
        icon={<Route className="size-5" />}
        title="Not reachable"
        description="No channel sells this catalog yet, so nothing in it can be bought. Bind one on the Catalog Channels page."
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
