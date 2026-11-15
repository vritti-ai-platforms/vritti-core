import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { purchaseLockTip } from '@/components/purchases/purchaseDocuments';
import { type InboundDeliveryData, InboundDeliverySourceValues } from '@/schemas/inbound-deliveries';
import type { InboundDeliveryMutationsBinding } from './bindings';

interface DeleteInboundDeliveryZoneProps {
  mutations: InboundDeliveryMutationsBinding;
  delivery: InboundDeliveryData;
}

// Deletes a delivery nothing has been received against, returning to the list; one a purchase created to receive or
// invoice against stays with the purchase
export const DeleteInboundDeliveryZone: React.FC<DeleteInboundDeliveryZoneProps> = ({ mutations, delivery }) => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const deleteMutation = mutations.useDelete();
  const { deliveryNumber } = delivery;
  const purchaseLock =
    delivery.purchaseNumber && delivery.source !== InboundDeliverySourceValues.ANNOUNCED
      ? purchaseLockTip(delivery.purchaseNumber)
      : undefined;

  // Confirms and deletes the delivery
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete "${deliveryNumber}"?`,
      description: `"${deliveryNumber}" and its lines will be permanently removed. Its purchase order lines stay open.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(delivery.id, { onSuccess: () => navigate('..') });
  };

  return (
    <DangerZone
      title="Delete Inbound Delivery"
      description="Permanently remove this delivery and its lines. The purchase order lines on it stay open."
      buttonText="Delete Inbound Delivery"
      onClick={handleDelete}
      isLoading={deleteMutation.isPending}
      disabled={!!purchaseLock}
      warning={purchaseLock}
      showWarning={!!purchaseLock}
      permission={mutations.permissions.delete}
    />
  );
};
