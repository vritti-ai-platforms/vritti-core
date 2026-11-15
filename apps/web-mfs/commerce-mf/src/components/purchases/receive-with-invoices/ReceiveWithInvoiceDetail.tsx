import { useSlugParams } from '@vritti/quantum-ui/hooks';
import type React from 'react';
import { ReceiveWithInvoiceStatusValues } from '@/schemas/receive-with-invoices';
import type { PurchasesBinding } from '../bindings';
import { ReceiveWithInvoiceEditor } from './ReceiveWithInvoiceEditor';
import { ReceiveWithInvoicePosted } from './ReceiveWithInvoicePosted';

// `…/purchases/receive-with-invoices/<number~id>` — a draft is edited, posted or discarded here; a posted one is read only
export const ReceiveWithInvoiceDetail: React.FC<{ binding: PurchasesBinding }> = ({ binding }) => {
  const { id } = useSlugParams('invoiceSlug');
  const { data: invoice } = binding.receiveWithInvoices.useReceiveWithInvoice(id);
  return invoice.status === ReceiveWithInvoiceStatusValues.POSTED ? (
    <ReceiveWithInvoicePosted binding={binding} invoice={invoice} />
  ) : (
    <ReceiveWithInvoiceEditor key={invoice.supplierInvoiceId} binding={binding} invoice={invoice} />
  );
};
