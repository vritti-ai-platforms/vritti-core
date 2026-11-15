import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import type { PurchaseHeader } from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';

interface DeletePurchaseZoneProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
}

// Deletes a purchase nothing exists behind yet, returning to the list
export const DeletePurchaseZone: React.FC<DeletePurchaseZoneProps> = ({ binding, purchase }) => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const deleteMutation = binding.useDelete();
  const { purchaseNumber } = purchase;

  // Confirms and deletes the purchase
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete "${purchaseNumber}"?`,
      description: `"${purchaseNumber}" and its items will be permanently removed.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(purchase.id, { onSuccess: () => navigate('..') });
  };

  return (
    <DangerZone
      title="Delete Purchase"
      description="Permanently remove this purchase and its items. Possible only before quotations or sourcing begin; after that, cancel it instead."
      buttonText="Delete Purchase"
      onClick={handleDelete}
      isLoading={deleteMutation.isPending}
      permission={binding.permissions.delete}
    />
  );
};
