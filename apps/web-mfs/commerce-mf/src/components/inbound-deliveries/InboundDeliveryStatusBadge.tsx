import { Badge } from '@vritti/quantum-ui/Badge';
import { type InboundDeliveryStatus, inboundDeliveryStatusConfig } from '@/schemas/inbound-deliveries';

export const InboundDeliveryStatusBadge = ({ status }: { status: InboundDeliveryStatus }) => {
  const { label, variant } = inboundDeliveryStatusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
};
