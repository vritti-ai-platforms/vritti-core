import { useDialog } from '@vritti/quantum-ui/hooks';
import type React from 'react';
import { AddSupplierInvoiceButton, AddSupplierInvoiceDialog } from '@/components/supplier-invoices/AddSupplierInvoice';
import { SupplierInvoicesTable } from '@/components/supplier-invoices/SupplierInvoicesTable';
import { SITE_SUPPLIER_INVOICES_TABLE_KEY, useSupplierInvoicesTable } from '@/hooks/site/supplier-invoices';
import { invoicesBinding } from '../../invoicesBinding';

interface InvoicesTabProps {
  supplierId: string;
}

// The supplier's invoices at the session site, on the supplier's page
export const InvoicesTab: React.FC<InvoicesTabProps> = ({ supplierId }) => {
  const supplierInvoicesTableQuery = useSupplierInvoicesTable(supplierId);
  const addDialog = useDialog();

  return (
    <>
      <SupplierInvoicesTable
        binding={invoicesBinding}
        mode="tab"
        query={supplierInvoicesTableQuery}
        slug={`commerce-site-supplier-${supplierId}-invoices`}
        queryKey={SITE_SUPPLIER_INVOICES_TABLE_KEY(supplierId)}
        supplierId={supplierId}
        addAction={<AddSupplierInvoiceButton binding={invoicesBinding} handle={addDialog} />}
        emptyDescription="Record the supplier's invoice, then invoice this site's receipts and charges on it."
      />
      <AddSupplierInvoiceDialog binding={invoicesBinding} handle={addDialog} supplierId={supplierId} />
    </>
  );
};
