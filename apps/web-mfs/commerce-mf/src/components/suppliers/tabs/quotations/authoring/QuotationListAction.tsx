import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { ArrowRight, FileText, Plus } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import type { SupplierQuotationAuthoring } from '@/components/suppliers/bindings';
import type { QuotationPath } from '@/components/suppliers/types';
import { SupplierQuotationDialog } from './forms/SupplierQuotationDialog';

interface QuotationListActionProps {
  authoring: SupplierQuotationAuthoring;
  supplierId: string;
  // An LE enrollment's list of the quotations posted to its site, which only links to the supplier's list
  siteId?: string;
  quotationPath: QuotationPath;
  viewPermission: string;
}

export const QuotationListAction: React.FC<QuotationListActionProps> = ({
  authoring,
  supplierId,
  siteId,
  quotationPath,
  viewPermission,
}) =>
  siteId ? (
    <GoToQuotationsAction permission={viewPermission} />
  ) : (
    <AddQuotationAction authoring={authoring} supplierId={supplierId} quotationPath={quotationPath} />
  );

const GoToQuotationsAction: React.FC<{ permission: string }> = ({ permission }) => {
  const navigate = useNavigate();
  return (
    <Button
      size="sm"
      variant="outline"
      permission={permission}
      startAdornment={<ArrowRight className="size-4" />}
      onClick={() => navigate('../../quotations', { relative: 'path' })}
    >
      Go to Quotations
    </Button>
  );
};

// Starts a draft quotation in one of the supplier's currencies and opens it
const AddQuotationAction: React.FC<Omit<QuotationListActionProps, 'siteId' | 'viewPermission'>> = ({
  authoring,
  supplierId,
  quotationPath,
}) => {
  const navigate = useNavigate();
  const addDialog = useDialog();
  const { currencyCode, currencyCodes } = authoring.useCurrencies(supplierId);

  return (
    <>
      <Button
        size="sm"
        permission={authoring.permissions.add}
        startAdornment={<Plus className="size-4" />}
        onClick={addDialog.open}
      >
        Add Quotation
      </Button>
      <Dialog
        handle={addDialog}
        icon={FileText}
        title="Add Quotation"
        description={
          authoring.posting.to === 'anySite'
            ? 'Starts a draft. Add its lines next, then post it to sites to make them their prices.'
            : "Starts a draft. Add its lines next, then post it to make them this site's prices."
        }
        content={(close) => (
          <SupplierQuotationDialog
            authoring={authoring}
            supplierId={supplierId}
            currencyCode={currencyCode}
            currencyCodes={currencyCodes}
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
