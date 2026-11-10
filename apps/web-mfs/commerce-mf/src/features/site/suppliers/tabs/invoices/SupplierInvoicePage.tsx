import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { SupplierInvoiceDetail } from '@/components/supplier-invoices/SupplierInvoiceDetail';
import { useSupplierInvoice } from '@/hooks/site/supplier-invoices';
import { invoicesBinding } from '../../invoicesBinding';

// `…/suppliers/<supplier>/invoices/<number~id>` — one of the supplier's invoices at the session site
export const SupplierInvoicePage = () => {
  const { supplierSlug, invoiceSlug } = useSlugParams('supplierSlug', 'invoiceSlug');
  const { data: invoice } = useSupplierInvoice(supplierSlug.id, invoiceSlug.id);
  return <SupplierInvoiceDetail binding={invoicesBinding} invoice={invoice} />;
};
