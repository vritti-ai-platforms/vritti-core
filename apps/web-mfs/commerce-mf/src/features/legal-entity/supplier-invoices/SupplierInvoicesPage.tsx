import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { AddSupplierInvoiceButton, AddSupplierInvoiceDialog } from '@/components/supplier-invoices/AddSupplierInvoice';
import { SupplierInvoicesTable } from '@/components/supplier-invoices/SupplierInvoicesTable';
import { LE_SUPPLIER_INVOICES_TABLE_KEY, useSupplierInvoicesTable } from '@/hooks/legal-entity/supplier-invoices';
import { SiteFilter } from '@/selectors/site';
import { binding } from './binding';

// The supplier invoices of the legal entity's sites — every site until some are picked in the context bar
export const SupplierInvoicesPage = () => {
  const supplierInvoicesTableQuery = useSupplierInvoicesTable();
  const addDialog = useDialog();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Supplier Invoices"
        description="Supplier invoices for received goods and landed charges, held for payment until they match their orders"
      />
      <SupplierInvoicesTable
        binding={binding}
        mode="page"
        query={supplierInvoicesTableQuery}
        slug="commerce-le-supplier-invoices"
        queryKey={LE_SUPPLIER_INVOICES_TABLE_KEY}
        contextBar={<SiteFilter name="sites" label="Sites" placeholder="All sites" mode="context" multiple />}
        addAction={<AddSupplierInvoiceButton binding={binding} handle={addDialog} />}
        emptyDescription="Record a supplier's invoice, then invoice the receipts and charges it covers."
      />
      <AddSupplierInvoiceDialog binding={binding} handle={addDialog} />
    </div>
  );
};
