import type React from 'react';
import { SupplierInvoicesTable } from '@/components/supplier-invoices/SupplierInvoicesTable';
import { SITE_SUPPLIER_INVOICES_TABLE_KEY, useSupplierInvoicesTable } from '@/hooks/site/supplier-invoices/index';
import { invoicesBinding } from '../../invoicesBinding';

interface InvoicesTabProps {
  supplierId: string;
}

// The supplier's invoices at the session site, on the supplier's page
export const InvoicesTab: React.FC<InvoicesTabProps> = ({ supplierId }) => {
  const supplierInvoicesTableQuery = useSupplierInvoicesTable(supplierId);

  return (
    <SupplierInvoicesTable
      binding={invoicesBinding}
      mode="tab"
      query={supplierInvoicesTableQuery}
      slug={`commerce-site-supplier-${supplierId}-invoices`}
      queryKey={SITE_SUPPLIER_INVOICES_TABLE_KEY(supplierId)}
      supplierId={supplierId}
      emptyDescription="Record the supplier's invoice against one of this site's confirmed purchase orders."
    />
  );
};
