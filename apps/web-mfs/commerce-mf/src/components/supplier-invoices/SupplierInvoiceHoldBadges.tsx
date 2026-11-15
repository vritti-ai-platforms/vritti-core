import { Badge } from '@vritti/quantum-ui/Badge';
import { StringCell } from '@vritti/quantum-ui/DataTable';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import {
  SUPPLIER_INVOICE_HOLD_LABELS,
  type SupplierInvoiceHold,
  type SupplierInvoiceHoldStatus,
  supplierInvoiceHoldStatusConfig,
} from '@/schemas/supplier-invoices';

// A hold's code, naming what differs on hover; an open hold that blocks payment stands out from information-only ones
export const SupplierInvoiceHoldCodeBadge = ({ hold }: { hold: SupplierInvoiceHold }) => (
  <Tooltip content={hold.detail}>
    <Badge variant={hold.status === 'OPEN' && hold.blocksPayment ? 'warning' : 'secondary'}>
      {SUPPLIER_INVOICE_HOLD_LABELS[hold.code]}
    </Badge>
  </Tooltip>
);

// Open, released or resolved
export const SupplierInvoiceHoldStatusBadge = ({ status }: { status: SupplierInvoiceHoldStatus }) => {
  const { label, variant } = supplierInvoiceHoldStatusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
};

// A line's open holds, or nothing when it has none
export const SupplierInvoiceLineHolds = ({ holds }: { holds: SupplierInvoiceHold[] }) => {
  const open = holds.filter((hold) => hold.status === 'OPEN');
  return open.length > 0 ? (
    <div className="flex flex-wrap gap-1">
      {open.map((hold) => (
        <SupplierInvoiceHoldCodeBadge key={hold.id} hold={hold} />
      ))}
    </div>
  ) : (
    <StringCell value={null} />
  );
};

// How many open holds block an invoice's payment
export const SupplierInvoiceOpenHoldCount = ({ count }: { count: number }) =>
  count > 0 ? <Badge variant="warning">{pluralize('hold', count, true)}</Badge> : <StringCell value={null} />;
