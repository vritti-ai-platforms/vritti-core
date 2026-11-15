import { Badge } from '@vritti/quantum-ui/Badge';
import { type SupplierInvoicePaymentStatus, supplierInvoicePaymentStatusConfig } from '@/schemas/supplier-invoices';

// Unpaid, partially paid or paid
export const SupplierInvoicePaymentStatusBadge = ({ status }: { status: SupplierInvoicePaymentStatus }) => {
  const { label, variant } = supplierInvoicePaymentStatusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
};
