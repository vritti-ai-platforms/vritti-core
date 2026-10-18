import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card } from '@vritti/quantum-ui/Card';
import { Progress } from '@vritti/quantum-ui/Progress';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Typography } from '@vritti/quantum-ui/Typography';
import { ArrowRight, Trash2 } from 'lucide-react';
import type React from 'react';
import type { CatalogCurrencyData } from '@/schemas/catalogs';
import { currencyName } from '@/selectors/currency';

interface CurrencyCardProps {
  currency: CatalogCurrencyData;
  editPermission: string;
  canEdit: boolean;
  isRemoving: boolean;
  onOpen: () => void;
  onRemove: () => void;
}

export const CurrencyCard: React.FC<CurrencyCardProps> = ({
  currency,
  editPermission,
  canEdit,
  isRemoving,
  onOpen,
  onRemove,
}) => {
  const { currencyCode, pricedCount, listingCount } = currency;
  const complete = listingCount > 0 && pricedCount === listingCount;
  const missing = listingCount - pricedCount;

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Typography variant="h6" className="font-mono">
            {currencyCode}
          </Typography>
          <Typography variant="caption" className="block truncate text-muted-foreground">
            {currencyName(currencyCode)}
          </Typography>
        </div>
        <Badge variant={complete ? 'success' : missing > 0 ? 'warning' : 'outline'}>
          {listingCount === 0 ? 'No listings' : complete ? 'Complete' : `${missing} unpriced`}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <Progress value={listingCount === 0 ? 0 : (pricedCount / listingCount) * 100} className="h-1.5" />
        <Typography variant="caption" className="text-muted-foreground">
          {`${pricedCount} of ${listingCount} ${pluralize('listing', listingCount)} priced`}
        </Typography>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t pt-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          endAdornment={<ArrowRight className="size-4" />}
          onClick={onOpen}
        >
          View prices
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          permission={editPermission}
          // Withdrawing a currency that still prices listings would strand those prices, so the server refuses it —
          // saying so here beats a toast after the click
          disabled={!canEdit || pricedCount > 0 || isRemoving}
          disabledTip={canEdit ? 'Clear its prices before removing it' : 'This price list belongs to a wider workspace'}
          onClick={onRemove}
          aria-label={`Remove ${currencyCode}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </Card>
  );
};
