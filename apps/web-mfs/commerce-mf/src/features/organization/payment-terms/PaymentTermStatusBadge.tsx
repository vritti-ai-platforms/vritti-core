import { Badge } from '@vritti/quantum-ui/Badge';
import { PAYMENT_TERM_STATUS_LABELS, type PaymentTermStatus } from '@/schemas/payment-terms';

const VARIANTS = { DRAFT: 'secondary', ACTIVE: 'success', INACTIVE: 'outline' } as const;

export const PaymentTermStatusBadge = ({ status }: { status: PaymentTermStatus }) => (
  <Badge variant={VARIANTS[status]}>{PAYMENT_TERM_STATUS_LABELS[status]}</Badge>
);
