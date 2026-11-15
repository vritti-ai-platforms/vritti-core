import type React from 'react';
import type { SupplierQuotationsBinding } from '../../bindings';
import { QuotationListAction } from './authoring/QuotationListAction';
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
  const authoring = binding.authoring;

  return (
    <QuotationsTable
      query={quotationsTableQuery}
      slug={binding.tableSlug(supplierId, siteId)}
      queryKey={binding.tableKey(supplierId, siteId)}
      permission={binding.permissions.view}
      quotationPath={quotationPath}
      showPosting={!!authoring && !siteId}
      toolbarAction={
        authoring && (
          <QuotationListAction
            authoring={authoring}
            supplierId={supplierId}
            siteId={siteId}
            quotationPath={quotationPath}
            viewPermission={binding.permissions.view}
          />
        )
      }
      emptyState={binding.emptyState(siteId)}
    />
  );
};
