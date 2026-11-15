import { Badge } from '@vritti/quantum-ui/Badge';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import { type PurchaseData, purchaseStepConfig } from '@/schemas/purchases';

interface PurchaseStageBadgeProps {
  purchase: Pick<PurchaseData, 'step'>;
  tip?: string;
}

// The stage a purchase is in, or ended in once completed or cancelled
export const PurchaseStageBadge = ({ purchase, tip }: PurchaseStageBadgeProps) => {
  const { label, variant } = purchaseStepConfig[purchase.step];
  const badge = <Badge variant={variant}>{label}</Badge>;
  return tip ? <Tooltip content={tip}>{badge}</Tooltip> : badge;
};
