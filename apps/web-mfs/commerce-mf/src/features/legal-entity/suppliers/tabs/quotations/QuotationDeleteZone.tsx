import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import type React from 'react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuotationSlotProps } from '@/components/suppliers/types';
import { useDeleteSupplierQuotation } from '@/hooks/legal-entity/supplier-quotations';

// Removes the quotation from every site it is posted to — deleting its prices there — then deletes it
export const QuotationDeleteZone: React.FC<QuotationSlotProps> = ({ supplierId, quotation }) => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const deleteMutation = useDeleteSupplierQuotation(supplierId, {
    onSuccess: () => navigate('../../quotations', { relative: 'path' }),
  });

  const handleDelete = useCallback(async () => {
    const ok = await confirm({
      title: `Delete quotation "${quotation.quotationNumber}"?`,
      description:
        quotation.sites.length > 0
          ? `It is removed from ${pluralize('site', quotation.sites.length, true)} first: its prices there are deleted and the prices they replaced apply again.`
          : 'The draft and its lines are deleted.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (ok) deleteMutation.mutate(quotation.id);
  }, [confirm, deleteMutation, quotation]);

  return (
    <DangerZone
      title="Delete this quotation"
      description="Removes it from every site it is posted to — deleting its prices there — and then deletes it."
      buttonText="Delete Quotation"
      permission={LE_SUPPLIERS.quotations.delete}
      onClick={handleDelete}
      isLoading={deleteMutation.isPending}
      disabled={deleteMutation.isPending}
    />
  );
};
