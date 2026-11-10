import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { DropdownMenu, type MenuItem } from '@vritti/quantum-ui/DropdownMenu';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Ban, MapPin, MoreVertical, PackageCheck, Pencil, Truck } from 'lucide-react';
import type React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import {
  type InboundDeliveryData,
  inboundDeliveryStatusConfig,
  type ManualInboundDeliveryStatus,
  manualInboundDeliveryStatusTransitions,
} from '@/schemas/inbound-deliveries';
import { workspaceBase } from '@/utils/workspace';
import type { InboundDeliveryMutationsBinding } from './bindings';
import { ReceiveInboundDeliveryDialog } from './forms/ReceiveInboundDeliveryDialog';
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
  mutations: InboundDeliveryMutationsBinding;
  delivery: InboundDeliveryData;
}

// The delivery's header actions: its manual status steps, the Actions menu and receiving it into a goods receipt; a delivery a goods receipt created only links back to that receipt
export const InboundDeliveryActions: React.FC<InboundDeliveryActionsProps> = ({ mutations, delivery }) => {
  const { permissions } = mutations;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const confirm = useConfirm();
  const receiveDialog = useDialog();
  const updateStatusMutation = mutations.useUpdateStatus();

  const { deliveryNumber, status } = delivery;
  const allowed = manualInboundDeliveryStatusTransitions[status];
  const forwardSteps = FORWARD_STEPS.filter((step) => allowed.includes(step.status));
  const canCancel = delivery.canCancel && allowed.includes('CANCELLED');
  const receiptsPath = `${workspaceBase(pathname)}/goods-receipts`;
  const sourceReceipt =
    delivery.source === 'RECEIPT' && delivery.sourceGoodsReceiptId && delivery.sourceGrNumber
      ? { id: delivery.sourceGoodsReceiptId, grNumber: delivery.sourceGrNumber }
      : null;

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
      confirmLabel: 'Cancel Delivery',
      variant: 'destructive',
    });
    if (confirmed) updateStatusMutation.mutate({ id: delivery.id, status: 'CANCELLED' });
  };

  // Opens a goods receipt of the delivery in the goods receipts feature
  const openReceipt = (receipt: GoodsReceiptData) =>
    navigate(`${receiptsPath}/${buildSlug(receipt.grNumber, receipt.id)}`);

  const menuItems: MenuItem[] = [
    {
      type: 'dialog',
      id: 'edit',
      label: 'Edit Details',
      icon: Pencil,
      permission: permissions.edit,
      hidden: !delivery.isEditable,
      dialog: {
        title: 'Edit Delivery',
        description: "Change when the delivery is expected, how it travels and the supplier's delivery note.",
        content: (close) => (
          <UpdateInboundDeliveryDialog mutations={mutations} delivery={delivery} onSuccess={close} onCancel={close} />
        ),
      },
    },
    {
      type: 'item',
      id: 'cancel',
      label: 'Cancel Delivery',
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
    <div className="flex items-center gap-2">
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
      {sourceReceipt ? (
        <Button
          size="sm"
          variant="outline"
          startAdornment={<PackageCheck className="size-4" />}
          onClick={() => navigate(`${receiptsPath}/${buildSlug(sourceReceipt.grNumber, sourceReceipt.id)}`)}
        >
          Open {sourceReceipt.grNumber}
        </Button>
      ) : delivery.draftGoodsReceiptId ? (
        <Button
          size="sm"
          permission={mutations.receivePermission}
          startAdornment={<PackageCheck className="size-4" />}
          onClick={() => navigate(`${receiptsPath}/${delivery.draftGoodsReceiptId}`)}
        >
          Open Draft Receipt
        </Button>
      ) : (
        delivery.canReceive && (
          <Button
            size="sm"
            permission={mutations.receivePermission}
            startAdornment={<PackageCheck className="size-4" />}
            onClick={receiveDialog.open}
          >
            Receive
          </Button>
        )
      )}

      <Dialog
        handle={receiveDialog}
        icon={PackageCheck}
        title="Receive Delivery"
        description={`Start a draft goods receipt of what is still open on ${deliveryNumber}'s lines.`}
        content={(close) => (
          <ReceiveInboundDeliveryDialog
            mutations={mutations}
            deliveryId={delivery.id}
            onSuccess={(receipt) => {
              close();
              openReceipt(receipt);
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
