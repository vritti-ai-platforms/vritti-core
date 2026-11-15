import { Badge } from '@vritti/quantum-ui/Badge';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import { type PurchaseData, purchaseStatusConfig } from '@/schemas/purchases';

interface PurchaseStatusBadgeProps {
  purchase: Pick<PurchaseData, 'status'>;
  tip?: string | null;
}

// Whether a purchase is open, completed or cancelled
export const PurchaseStatusBadge = ({ purchase, tip }: PurchaseStatusBadgeProps) => {
  const { label, variant } = purchaseStatusConfig[purchase.status];
  const badge = <Badge variant={variant}>{label}</Badge>;
  return tip ? <Tooltip content={tip}>{badge}</Tooltip> : badge;
};
