import { Button } from '@vritti/quantum-ui/Button';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import type { PurchaseHeader } from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';
import type { SourcingQuote } from './sourcingRows';

interface SourcingQuotesProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  quotes: SourcingQuote[];
  canAllocate: boolean;
}

// An item's quotes side by side, per primary unit, the best one highlighted; each can be taken as an allocation
export const SourcingQuotes: React.FC<SourcingQuotesProps> = ({ binding, purchase, quotes, canAllocate }) => {
  const fmt = useFormatters();
  const allocateMutation = binding.useAddAllocationsFromQuotation();
  if (quotes.length === 0) {
    return (
      <Typography variant="caption" intent="muted" align="center">
        Not quoted
      </Typography>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {quotes.map(({ quotation, line, isBest }) => (
        <div key={line.id} className="flex items-center justify-center gap-2">
          <Typography variant="body2" intent={isBest ? 'success' : 'default'} className="font-mono">
            {fmt.currency(line.unitPricePerPrimary).primary}
          </Typography>
          <Typography variant="caption" intent="muted">
            {quotation.supplierName}
          </Typography>
          {canAllocate && (
            <Button
              size="sm"
              variant="ghost"
              permission={binding.permissions.edit}
              isLoading={
                allocateMutation.isPending && allocateMutation.variables?.supplierQuotationItemIds[0] === line.id
              }
              onClick={() => allocateMutation.mutate({ id: purchase.id, supplierQuotationItemIds: [line.id] })}
            >
              Use
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};
