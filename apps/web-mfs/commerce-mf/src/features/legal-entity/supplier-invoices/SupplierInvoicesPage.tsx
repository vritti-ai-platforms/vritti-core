import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SupplierInvoicesTable } from '@/components/supplier-invoices/SupplierInvoicesTable';
import { LE_SUPPLIER_INVOICES_TABLE_KEY, useSupplierInvoicesTable } from '@/hooks/legal-entity/supplier-invoices';
import { SiteFilter } from '@/selectors/site';
import { binding } from './binding';

// The supplier invoices of the legal entity's sites — every site until some are picked in the context bar
export const SupplierInvoicesPage = () => {
  const supplierInvoicesTableQuery = useSupplierInvoicesTable();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Supplier Invoices"
        description="Supplier bills against purchase orders, matched to what was ordered and received"
      />
      <SupplierInvoicesTable
        binding={binding}
        mode="page"
        query={supplierInvoicesTableQuery}
        slug="commerce-le-supplier-invoices"
        queryKey={LE_SUPPLIER_INVOICES_TABLE_KEY}
        contextBar={<SiteFilter name="sites" label="Sites" placeholder="All sites" mode="context" multiple />}
        emptyDescription="Record a supplier's invoice against a confirmed purchase order, then enter its billed lines."
      />
    </div>
  );
};
