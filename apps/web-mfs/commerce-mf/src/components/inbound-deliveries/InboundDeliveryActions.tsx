import { Button } from '@vritti/quantum-ui/Button';
import { DropdownMenu, type MenuItem } from '@vritti/quantum-ui/DropdownMenu';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { Ban, MapPin, MoreVertical, PackageCheck, Pencil, Truck } from 'lucide-react';
import type React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { receiveDeliverySearch } from '@/components/goods-receipts/receiveDeliverySearch';
import {
  type InboundDeliveryData,
  InboundDeliverySourceValues,
  inboundDeliveryStatusConfig,
  type ManualInboundDeliveryStatus,
  manualInboundDeliveryStatusTransitions,
} from '@/schemas/inbound-deliveries';
import { workspaceBase } from '@/utils/workspace';
import type { InboundDeliveriesBinding, InboundDeliveryMutationsBinding } from './bindings';
import { UpdateInboundDeliveryDialog } from './forms/UpdateInboundDeliveryDialog';

const FORWARD_STEPS: {
  status: Exclude<ManualInboundDeliveryStatus, 'CANCELLED'>;
  label: string;
  icon: typeof Truck;
}[] = [
  { status: 'IN_TRANSIT', label: 'Mark In Transit', icon: Truck },
  { status: 'ARRIVED', label: 'Mark Arrived', icon: MapPin },
];

interface InboundDeliveryActionsProps {
  binding: InboundDeliveriesBinding;
  delivery: InboundDeliveryData;
}

// The delivery's header actions: where the binding enters deliveries, its manual status steps and the Actions menu; and
// receiving it — the goods receipts list opens with the delivery preselected, or its draft receipt opens
export const InboundDeliveryActions: React.FC<InboundDeliveryActionsProps> = ({ binding, delivery }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const receiptsPath = `${workspaceBase(pathname)}/goods-receipts`;
  const receiveAction =
    delivery.source !== InboundDeliverySourceValues.ANNOUNCED ? null : delivery.draftGoodsReceiptId ? (
      <Button
        size="sm"
        permission={binding.receivePermission}
        startAdornment={<PackageCheck className="size-4" />}
        onClick={() => navigate(`${receiptsPath}/${delivery.draftGoodsReceiptId}`)}
      >
        Open Draft Receipt
      </Button>
    ) : (
      delivery.canReceive && (
        <Button
          size="sm"
          permission={binding.receivePermission}
          startAdornment={<PackageCheck className="size-4" />}
          onClick={() => navigate(`${receiptsPath}${receiveDeliverySearch(delivery.id)}`)}
        >
          Receive
        </Button>
      )
    );

  return (
    <div className="flex items-center gap-2">
      {binding.mutations && <DeliveryWorkflowActions mutations={binding.mutations} delivery={delivery} />}
      {receiveAction}
    </div>
  );
};

interface DeliveryWorkflowActionsProps {
  mutations: InboundDeliveryMutationsBinding;
  delivery: InboundDeliveryData;
}

// The manual status steps and the Actions menu of a delivery the site enters
const DeliveryWorkflowActions: React.FC<DeliveryWorkflowActionsProps> = ({ mutations, delivery }) => {
  const { permissions } = mutations;
  const confirm = useConfirm();
  const updateStatusMutation = mutations.useUpdateStatus();

  const { deliveryNumber, status } = delivery;
  const allowed = manualInboundDeliveryStatusTransitions[status];
  const forwardSteps = FORWARD_STEPS.filter((step) => allowed.includes(step.status));
  const canCancel = delivery.canCancel && allowed.includes('CANCELLED');
  // Confirms and applies a manual status step
  const handleStatusChange = async (nextStatus: ManualInboundDeliveryStatus, label: string) => {
    const confirmed = await confirm({
      title: `${label}?`,
      description: `"${deliveryNumber}" will move to "${inboundDeliveryStatusConfig[nextStatus].label}".`,
      confirmLabel: label,
    });
    if (confirmed) updateStatusMutation.mutate({ id: delivery.id, status: nextStatus });
  };

  // Confirms and cancels the delivery; its purchase order lines stay open
  const handleCancel = async () => {
    const confirmed = await confirm({
      title: `Cancel "${deliveryNumber}"?`,
      description: `"${deliveryNumber}" will be marked as cancelled and can no longer be received. Its purchase order lines stay open. This cannot be undone.`,
      confirmLabel: 'Cancel Inbound Delivery',
      variant: 'destructive',
    });
    if (confirmed) updateStatusMutation.mutate({ id: delivery.id, status: 'CANCELLED' });
  };

  const menuItems: MenuItem[] = [
    {
      type: 'dialog',
      id: 'edit',
      label: 'Edit Details',
      icon: Pencil,
      permission: permissions.edit,
      hidden: !delivery.isEditable,
      dialog: {
        title: 'Edit Inbound Delivery',
        description: "Change when the delivery is expected, how it travels and the supplier's delivery note.",
        content: (close) => (
          <UpdateInboundDeliveryDialog mutations={mutations} delivery={delivery} onSuccess={close} onCancel={close} />
        ),
      },
    },
    {
      type: 'item',
      id: 'cancel',
      label: 'Cancel Inbound Delivery',
      icon: Ban,
      variant: 'destructive',
      permission: permissions.edit,
      hidden: !canCancel,
      disabled: updateStatusMutation.isPending,
      onClick: handleCancel,
    },
  ];
  const hasMenuItems = delivery.isEditable || canCancel;

  return (
    <>
      {hasMenuItems && (
        <DropdownMenu
          trigger={{
            children: (
              <Button size="sm" variant="outline" endAdornment={<MoreVertical className="size-4" />}>
                Actions
              </Button>
            ),
          }}
          items={menuItems}
          align="end"
        />
      )}
      {forwardSteps.map((step) => (
        <Button
          key={step.status}
          size="sm"
          variant="outline"
          permission={permissions.edit}
          startAdornment={<step.icon className="size-4" />}
          onClick={() => handleStatusChange(step.status, step.label)}
          isLoading={updateStatusMutation.isPending && updateStatusMutation.variables?.status === step.status}
        >
          {step.label}
        </Button>
      ))}
    </>
  );
};
