import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import type { PurchaseDetail, PurchaseItemQuote } from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';

interface PurchaseItemQuotesProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  // Cheapest per primary unit first within each currency, as the server sends them
  quotes: PurchaseItemQuote[];
  canAllocate: boolean;
  allocateTip: string;
  align?: 'start' | 'center';
}

// The posted quotes that are the cheapest of several in their currency
function bestQuoteIds(quotes: PurchaseItemQuote[]): Set<string> {
  const posted = quotes.filter((quote) => quote.isPosted);
  if (posted.length < 2) return new Set();
  const seen = new Set<string>();
  const best = new Set<string>();
  for (const quote of posted) {
    if (seen.has(quote.line.unitPricePerPrimary.currency)) continue;
    seen.add(quote.line.unitPricePerPrimary.currency);
    best.add(quote.line.id);
  }
  return best;
}

// An item's quotes side by side, per primary unit, the best one highlighted; a posted one can be taken as an
// allocation of what is still unallocated, a draft waits for its prices
export const PurchaseItemQuotes: React.FC<PurchaseItemQuotesProps> = ({
  binding,
  purchase,
  quotes,
  canAllocate,
  allocateTip,
  align = 'center',
}) => {
  const fmt = useFormatters();
  const allocateMutation = binding.useAddAllocationsFromQuotation();
  const best = bestQuoteIds(quotes);
  const justify = align === 'center' ? 'justify-center' : 'justify-start';
  if (quotes.length === 0) {
    return (
      <Typography variant="caption" intent="muted" align={align === 'center' ? 'center' : 'left'}>
        Not quoted
      </Typography>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {quotes.map((quote) => (
        <div key={quote.line.id} className={`flex items-center gap-2 ${justify}`}>
          {quote.isPosted ? (
            <Typography variant="body2" intent={best.has(quote.line.id) ? 'success' : 'default'} className="font-mono">
              {fmt.currency(quote.line.unitPricePerPrimary).primary}
            </Typography>
          ) : (
            <Badge variant="outline">{binding.quotations.draftLabel}</Badge>
          )}
          <Typography variant="caption" intent="muted">
            {quote.supplierName}
          </Typography>
          {quote.isPosted && (
            <Button
              size="sm"
              variant="ghost"
              permission={binding.permissions.edit}
              disabled={!canAllocate}
              disabledTip={allocateTip}
              isLoading={
                allocateMutation.isPending &&
                allocateMutation.variables?.supplierQuotationItemIds?.[0] === quote.line.id
              }
              onClick={() => allocateMutation.mutate({ id: purchase.id, supplierQuotationItemIds: [quote.line.id] })}
            >
              Use
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};
