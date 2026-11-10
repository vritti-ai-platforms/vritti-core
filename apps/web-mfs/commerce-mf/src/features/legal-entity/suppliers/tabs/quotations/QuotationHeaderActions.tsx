import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { FileText, Pencil } from 'lucide-react';
import type React from 'react';
import type { QuotationSlotProps } from '@/components/suppliers/types';
import { useSupplier } from '@/hooks/legal-entity/suppliers';
import { SupplierQuotationDialog } from './forms/SupplierQuotationDialog';

// Edits the quotation's reference, date and note
export const QuotationHeaderActions: React.FC<QuotationSlotProps> = ({ supplierId, quotation }) => {
  const editDialog = useDialog();
  const { data: supplier } = useSupplier(supplierId);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        permission={LE_SUPPLIERS.quotations.edit}
        startAdornment={<Pencil className="size-4" />}
        onClick={editDialog.open}
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
            supplierId={supplierId}
            currencyCode={supplier.currencyCode}
            currencyCodes={supplier.currencyCodes}
            quotation={quotation}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
