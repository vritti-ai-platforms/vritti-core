import { Badge } from '@vritti/quantum-ui/Badge';
import { SUPPLIER_QUOTATION_STATUS_LABELS, type SupplierQuotationStatus } from '@/schemas/supplier-quotations';

export const QuotationStatusBadge = ({ status }: { status: SupplierQuotationStatus }) => (
  <Badge variant={status === 'POSTED' ? 'success' : 'secondary'}>{SUPPLIER_QUOTATION_STATUS_LABELS[status]}</Badge>
);
