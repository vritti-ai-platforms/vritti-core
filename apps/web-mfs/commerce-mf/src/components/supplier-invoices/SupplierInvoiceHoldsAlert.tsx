import { Alert } from '@vritti/quantum-ui/Alert';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import type { SupplierInvoiceDetail } from '@/schemas/supplier-invoices';

// Why a posted invoice cannot be paid yet — its open holds, or the supplier's payments being blocked; a draft with open
// holds is warned before it is posted
export const SupplierInvoiceHoldsAlert = ({ invoice }: { invoice: SupplierInvoiceDetail }) => {
  if (invoice.status === 'CANCELLED') return null;
  if (invoice.openHoldCount > 0) {
    return (
      <Alert
        variant="warning"
        title={`Payment blocked by ${pluralize('open hold', invoice.openHoldCount, true)}`}
        description="Correct the line a hold is on, or release it with a reason on the Holds tab. The invoice can still be posted."
      />
    );
  }
  if (invoice.status === 'POSTED' && !invoice.isPayable) {
    return (
      <Alert
        variant="warning"
        title="Payments to this supplier are blocked"
        description="The invoice has no open holds, but it cannot be paid until the supplier's payment block is lifted."
      />
    );
  }
  return null;
};
