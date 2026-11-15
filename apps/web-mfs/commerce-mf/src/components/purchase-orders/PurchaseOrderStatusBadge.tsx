import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type PurchaseOrderInvoiceStatus,
  type PurchaseOrderReceiptStatus,
  type PurchaseOrderStatus,
  purchaseOrderInvoiceStatusConfig,
  purchaseOrderReceiptStatusConfig,
  purchaseOrderStatusConfig,
} from '@/schemas/purchase-orders';

// Where the order is in its lifecycle
export const PurchaseOrderStatusBadge = ({ status }: { status: PurchaseOrderStatus }) => {
  const { label, variant } = purchaseOrderStatusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
};

// How much of what the order is due has been received
export const PurchaseOrderReceiptStatusBadge = ({ status }: { status: PurchaseOrderReceiptStatus }) => {
  const { label, variant } = purchaseOrderReceiptStatusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
};

// How much of what the order received has been invoiced
export const PurchaseOrderInvoiceStatusBadge = ({ status }: { status: PurchaseOrderInvoiceStatus }) => {
  const { label, variant } = purchaseOrderInvoiceStatusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
};
