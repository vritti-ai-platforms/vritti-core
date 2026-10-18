import { Card } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PermissionGate } from '@vritti/quantum-ui/PermissionGate';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Typography } from '@vritti/quantum-ui/Typography';
import { ArrowRight, Coins } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { currencyName } from '@/selectors/currency';
import type { CatalogChannelsBinding } from '../bindings';

interface CurrenciesTabProps {
  binding: CatalogChannelsBinding;
  channelId: string;
}

// The currencies this channel can quote in. Each opens what it charges and what it excludes.
export const CurrenciesTab: React.FC<CurrenciesTabProps> = ({ binding, channelId }) => {
  const { data: currencies = [], isLoading } = binding.useChannelCurrencies(channelId);
  const navigate = useNavigate();

  // This tab only renders on `…/<channel>/currencies`, so the currency hangs straight off the URL
  const openCurrency = (currencyCode: string) => navigate(currencyCode, { relative: 'path' });

  // The tab wrapper stretches its direct child, so the scroller takes that height and the grid inside it starts at the
  // top — otherwise one row of cards is stretched down the whole viewport
  if (isLoading) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (currencies.length === 0) {
    return (
      <Empty
        icon={<Coins />}
        title="No currencies yet"
        description="This channel quotes in whatever its catalog is priced in. Add a currency on the catalog's Prices tab."
      />
    );
  }

  return (
    <PermissionGate permission={binding.permissions.prices}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currencies.map((currencyCode) => (
            <Card
              key={currencyCode}
              // Card is a column by default, so the row lives inside it rather than on it
              className="cursor-pointer gap-0 p-4 transition-colors hover:bg-accent/50"
              onClick={() => openCurrency(currencyCode)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Typography variant="h6" className="font-mono">
                    {currencyCode}
                  </Typography>
                  <Typography variant="caption" className="block truncate text-muted-foreground">
                    {currencyName(currencyCode)}
                  </Typography>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PermissionGate>
  );
};
