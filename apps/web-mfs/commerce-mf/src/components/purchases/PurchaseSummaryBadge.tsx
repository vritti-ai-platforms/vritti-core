import { Badge } from '@vritti/quantum-ui/Badge';
import { type PurchaseTableRow, purchaseSummaryConfig } from '@/schemas/purchases';

interface PurchaseSummaryBadgeProps {
  purchase: Pick<PurchaseTableRow, 'summary'>;
}

// How far an open purchase's items have got as a whole: not started, sourcing, ordered, partly or fully received
export const PurchaseSummaryBadge = ({ purchase }: PurchaseSummaryBadgeProps) => {
  if (!purchase.summary) return null;
  const { label, variant } = purchaseSummaryConfig[purchase.summary];
  return <Badge variant={variant}>{label}</Badge>;
};
