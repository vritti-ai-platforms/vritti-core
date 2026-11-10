import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { ArrowRight, FileText, Plus } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuotationPath } from '@/components/suppliers/types';
import { useSupplier } from '@/hooks/legal-entity/suppliers';
import { SupplierQuotationDialog } from './forms/SupplierQuotationDialog';

interface QuotationListActionProps {
  supplierId: string;
  siteId?: string;
  quotationPath: QuotationPath;
}

// A quotation is recorded on the supplier, so a site's list only links to the supplier's Quotations tab
export const QuotationListAction: React.FC<QuotationListActionProps> = ({ supplierId, siteId, quotationPath }) =>
  siteId ? <GoToQuotationsAction /> : <AddQuotationAction supplierId={supplierId} quotationPath={quotationPath} />;

const GoToQuotationsAction: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Button
      size="sm"
      variant="outline"
      permission={LE_SUPPLIERS.quotations.view}
      startAdornment={<ArrowRight className="size-4" />}
      onClick={() => navigate('../../quotations', { relative: 'path' })}
    >
      Go to Quotations
    </Button>
  );
};

// Starts a draft quotation in one of the supplier's currencies and opens it
const AddQuotationAction: React.FC<Omit<QuotationListActionProps, 'siteId'>> = ({ supplierId, quotationPath }) => {
  const navigate = useNavigate();
  const addDialog = useDialog();
  const { data: supplier } = useSupplier(supplierId);

  return (
    <>
      <Button
        size="sm"
        permission={LE_SUPPLIERS.quotations.add}
        startAdornment={<Plus className="size-4" />}
        onClick={addDialog.open}
      >
        Add Quotation
      </Button>
      <Dialog
        handle={addDialog}
        icon={FileText}
        title="Add Quotation"
        description="Starts a draft. Add its lines next, then post it to sites to make them their prices."
        content={(close) => (
          <SupplierQuotationDialog
            supplierId={supplierId}
            currencyCode={supplier.currencyCode}
            currencyCodes={supplier.currencyCodes}
            onSuccess={(created) => {
              close();
              if (created) navigate(quotationPath(created), { relative: 'path' });
            }}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
