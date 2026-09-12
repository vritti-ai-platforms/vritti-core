import { useQuery } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Select, type SelectValue } from '@vritti/quantum-ui/Select';
import { LegalEntitySelector } from '@vritti/quantum-ui/selects/legal-entity';
import { SiteSelector } from '@vritti/quantum-ui/selects/site';
import type { AxiosError } from 'axios';
import { CircleAlert, Route } from 'lucide-react';
import { useState } from 'react';
import {
  CATALOG_CHANNEL_TYPES,
  type CatalogChannelType,
  CHANNEL_TYPE_META,
  type ResolvedCatalogData,
} from '@/schemas/catalog-channels';
import { resolveCatalogChannel } from '@/services/organization/catalog-channels.service';

const SCOPE_LABEL: Record<ResolvedCatalogData['matchedScope'], string> = {
  SITE: 'outlet',
  LEGAL_ENTITY: 'company',
  ORGANIZATION: 'organization',
};

// Diagnostic: answers "what would this channel sell?" without anyone reading the bindings by hand
export const ResolveChannelCard: React.FC = () => {
  const [type, setType] = useState<CatalogChannelType>('APP');
  const [legalEntityId, setLegalEntityId] = useState<string | undefined>();
  const [siteId, setSiteId] = useState<string | undefined>();

  const { data, error, isFetching } = useQuery<ResolvedCatalogData, AxiosError>({
    queryKey: ['commerce', 'org', 'catalog-channels', 'resolve', type, legalEntityId, siteId],
    queryFn: () =>
      resolveCatalogChannel({
        type,
        legalEntityId,
        siteId,
      }),
    retry: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>What does this channel sell?</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Select
            label="Channel type"
            value={type}
            onChange={(value: SelectValue) => setType(value as CatalogChannelType)}
            options={CATALOG_CHANNEL_TYPES.map((value) => ({
              value,
              label: CHANNEL_TYPE_META[value].label,
              description: CHANNEL_TYPE_META[value].description,
            }))}
          />
          <LegalEntitySelector
            label="Company"
            placeholder="Any company"
            value={legalEntityId}
            onChange={(value: SelectValue) => {
              setLegalEntityId((value as string) || undefined);
              setSiteId(undefined);
            }}
          />
          <SiteSelector
            label="Outlet"
            placeholder="Any outlet"
            value={siteId}
            onChange={(value: SelectValue) => setSiteId((value as string) || undefined)}
            disabled={!legalEntityId}
          />
        </div>

        {isFetching ? (
          <div className="text-muted-foreground text-sm">Resolving…</div>
        ) : data ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="font-semibold">{data.catalogName}</div>
            <div className="mt-1 text-muted-foreground text-sm">
              Matched the {SCOPE_LABEL[data.matchedScope]}-level binding
              {data.matchedTarget ? ' for a named app or till' : ''}.
            </div>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline">{data.taxInclusive ? 'Prices include tax' : 'Prices exclude tax'}</Badge>
            </div>
          </div>
        ) : (
          <Empty
            icon={<CircleAlert className="size-5 text-warning" />}
            title="Nothing resolves"
            description={
              (error?.response?.data as { detail?: string } | undefined)?.detail ??
              'No binding covers this channel, so it has nothing to sell.'
            }
          />
        )}
      </CardContent>
    </Card>
  );
};

export const ResolveChannelIcon = Route;
