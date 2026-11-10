import type React from 'react';
import type { SupplierQuotationsBinding } from '../../bindings';
import { QuotationsTable } from './QuotationsTable';

interface QuotationsTabProps {
  binding: SupplierQuotationsBinding;
  supplierId: string;
  // Narrows the list to the quotations posted to this site
  siteId?: string;
}

// A supplier's quotations, or those posted to one site; authoring adds the toolbar action and the posting columns
export const QuotationsTab: React.FC<QuotationsTabProps> = ({ binding, supplierId, siteId }) => {
  const quotationsTableQuery = binding.useTable(supplierId, siteId);
  const quotationPath = binding.useQuotationPath(siteId);
  const ListAction = binding.authoring?.ListAction;

  return (
    <QuotationsTable
      query={quotationsTableQuery}
      slug={binding.tableSlug(supplierId, siteId)}
      queryKey={binding.tableKey(supplierId, siteId)}
      permission={binding.permissions.view}
      quotationPath={quotationPath}
      showPosting={!!binding.authoring && !siteId}
      toolbarAction={ListAction && <ListAction supplierId={supplierId} siteId={siteId} quotationPath={quotationPath} />}
      emptyState={binding.emptyState(siteId)}
    />
  );
};
