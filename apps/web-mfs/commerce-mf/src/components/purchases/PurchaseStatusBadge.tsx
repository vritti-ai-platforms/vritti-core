import { Badge } from '@vritti/quantum-ui/Badge';
import { type PurchaseData, purchaseStatusConfig } from '@/schemas/purchases';

// Whether a purchase is open, completed or cancelled
export const PurchaseStatusBadge = ({ purchase }: { purchase: Pick<PurchaseData, 'status'> }) => {
  const { label, variant } = purchaseStatusConfig[purchase.status];
  return <Badge variant={variant}>{label}</Badge>;
};
