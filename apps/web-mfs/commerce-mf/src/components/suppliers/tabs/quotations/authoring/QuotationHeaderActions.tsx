import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { FileText, Pencil } from 'lucide-react';
import type React from 'react';
import type { QuotationSlotProps } from '@/components/suppliers/bindings';
import { SupplierQuotationDialog } from './forms/SupplierQuotationDialog';

// Edits the quotation's reference, date and note
export const QuotationHeaderActions: React.FC<QuotationSlotProps> = ({ authoring, supplierId, quotation }) => {
  const editDialog = useDialog();
  const { currencyCode, currencyCodes } = authoring.useCurrencies(supplierId);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        permission={authoring.permissions.edit}
        startAdornment={<Pencil className="size-4" />}
        onClick={editDialog.open}
        disabled={!quotation.canWrite}
        disabledTip={`Owned by ${quotation.ownerName}`}
      >
        Edit
      </Button>
      <Dialog
        handle={editDialog}
        icon={FileText}
        title="Edit Quotation"
        description="Update the quotation's reference, date and note. Its validity is fixed once posted."
        content={(close) => (
          <SupplierQuotationDialog
            authoring={authoring}
            supplierId={supplierId}
            currencyCode={currencyCode}
            currencyCodes={currencyCodes}
            quotation={quotation}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
