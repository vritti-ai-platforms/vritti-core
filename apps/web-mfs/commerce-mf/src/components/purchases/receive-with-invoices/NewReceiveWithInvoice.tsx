import type React from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PurchasesBinding } from '../bindings';
import { ReceiveWithInvoiceEditor } from './ReceiveWithInvoiceEditor';
import { RECEIVE_WITH_INVOICE_SITE_PARAM, RECEIVE_WITH_INVOICE_SUPPLIER_PARAM } from './receiveWithInvoiceSearch';

// `…/purchases/receive-with-invoices/new` — a new Receive with Invoice, for the supplier it was opened from and, at
// the legal entity, the site picked in the list
export const NewReceiveWithInvoice: React.FC<{ binding: PurchasesBinding }> = ({ binding }) => {
  const [searchParams] = useSearchParams();
  return (
    <ReceiveWithInvoiceEditor
      binding={binding}
      supplierId={searchParams.get(RECEIVE_WITH_INVOICE_SUPPLIER_PARAM) ?? undefined}
      siteId={binding.spansSites ? (searchParams.get(RECEIVE_WITH_INVOICE_SITE_PARAM) ?? undefined) : undefined}
    />
  );
};
