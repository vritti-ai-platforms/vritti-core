import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { CheckCircle2, FileText, PackageCheck, PackageX, ReceiptText, ShoppingCart, Truck } from 'lucide-react';
import type React from 'react';
import { Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoodsReceiptStatus } from '@/schemas/goods-receipts';
import { PurchaseOrderStatusValues } from '@/schemas/purchase-orders';
import {
  type PurchaseHeader,
  type PurchaseLeg,
  type PurchaseLegAction,
  PurchaseLegActionValues,
  type PurchaseLegPurchaseOrder,
  PurchaseLegStatusValues,
  type PurchaseLegStep,
  PurchaseLegStepValues,
  type PurchaseType,
  PurchaseTypeValues,
} from '@/schemas/purchases';
import { SupplierInvoiceStatusValues } from '@/schemas/supplier-invoices';
import { workspaceBase } from '@/utils/workspace';
import type { PurchasesBinding } from '../bindings';
import { goodsReceiptPath, purchasesPath } from '../documentPaths';
import { CreatePurchaseSupplierInvoiceDialog } from '../forms/CreatePurchaseSupplierInvoiceDialog';
import { receiveWithInvoiceSearch } from '../receive-with-invoices/receiveWithInvoiceSearch';
import { CloseSupplierDialog } from './forms/CloseSupplierDialog';
import { CreateLegGoodsReceiptDialog } from './forms/CreateLegGoodsReceiptDialog';
import { CreateLegInboundDeliveryDialog } from './forms/CreateLegInboundDeliveryDialog';
import { CreateLegPurchaseOrderDialog } from './forms/CreateLegPurchaseOrderDialog';

// The actions that move a leg through its current step, in the order they would be taken
const STEP_ACTIONS: Partial<Record<PurchaseLegStep, PurchaseLegAction[]>> = {
  PURCHASE_ORDER: [PurchaseLegActionValues.CREATE_PURCHASE_ORDER, PurchaseLegActionValues.CONFIRM_PURCHASE_ORDER],
  INBOUND_DELIVERY: [PurchaseLegActionValues.CREATE_INBOUND_DELIVERY],
  GOODS_RECEIPT: [PurchaseLegActionValues.CREATE_GOODS_RECEIPT],
  RECEIVE_WITH_INVOICE: [PurchaseLegActionValues.RECEIVE_WITH_INVOICE],
  SUPPLIER_INVOICE: [PurchaseLegActionValues.CREATE_SUPPLIER_INVOICE],
};

const COMING_SOON_TYPES: PurchaseType[] = [PurchaseTypeValues.PREPAID, PurchaseTypeValues.SELF_INVOICING];

interface LegActionButton {
  key: string;
  action: PurchaseLegAction;
  element: (variant: 'default' | 'outline') => React.ReactNode;
}

interface PurchaseLegFulfilmentActionsProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  leg: PurchaseLeg;
}

// A leg's fulfilment actions as its type and documents allow them — create a purchase order, confirm a sent one,
// create an inbound delivery, create a goods receipt, receive with invoice, create a supplier invoice, close — with the
// one that moves its current step as the primary, rightmost
export const PurchaseLegFulfilmentActions: React.FC<PurchaseLegFulfilmentActionsProps> = ({
  binding,
  purchase,
  leg,
}) => {
  const { permissions } = binding;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const workspace = workspaceBase(pathname);
  const confirm = useConfirm();
  const purchaseOrderDialog = useDialog();
  const inboundDeliveryDialog = useDialog();
  const goodsReceiptDialog = useDialog();
  const supplierInvoiceDialog = useDialog();
  const closeDialog = useDialog();
  const confirmOrderMutation = binding.useConfirmLegPurchaseOrder();

  const isAvailable = (action: PurchaseLegAction) => leg.availableActions.includes(action);
  const primaryAction = (STEP_ACTIONS[leg.step] ?? []).find(isAvailable);
  const hasDrafts =
    leg.documents.receipts.some((receipt) => receipt.status === GoodsReceiptStatus.DRAFT) ||
    leg.documents.invoices.some((invoice) => invoice.status === SupplierInvoiceStatusValues.DRAFT);
  const isComingSoon =
    COMING_SOON_TYPES.includes(leg.type) &&
    leg.status === PurchaseLegStatusValues.OPEN &&
    leg.step !== PurchaseLegStepValues.SOURCING &&
    leg.step !== PurchaseLegStepValues.APPROVAL;
  const siteId = binding.spansSites ? purchase.siteId : undefined;

  // Confirms one of the leg's sent orders: the supplier has accepted it
  const handleConfirmOrder = async (order: PurchaseLegPurchaseOrder) => {
    const confirmed = await confirm({
      title: `Confirm ${order.poNumber}?`,
      description: `${leg.supplierName} has accepted the order; inbound deliveries and goods receipts can now be created against it.`,
      confirmLabel: 'Confirm Purchase Order',
    });
    if (confirmed) confirmOrderMutation.mutate({ id: purchase.id, legId: leg.id, purchaseOrderId: order.id });
  };

  const allButtons: LegActionButton[] = [
    {
      key: 'purchase-order',
      action: PurchaseLegActionValues.CREATE_PURCHASE_ORDER,
      element: (variant) => (
        <Button
          size="sm"
          variant={variant}
          permission={permissions.edit}
          startAdornment={<ShoppingCart className="size-4" />}
          onClick={purchaseOrderDialog.open}
        >
          Create Purchase Order
        </Button>
      ),
    },
    ...leg.documents.purchaseOrders
      .filter((order) => order.status === PurchaseOrderStatusValues.SENT)
      .map(
        (order): LegActionButton => ({
          key: `confirm-${order.id}`,
          action: PurchaseLegActionValues.CONFIRM_PURCHASE_ORDER,
          element: (variant) => (
            <Button
              size="sm"
              variant={variant}
              permission={permissions.edit}
              startAdornment={<CheckCircle2 className="size-4" />}
              onClick={() => handleConfirmOrder(order)}
              isLoading={confirmOrderMutation.isPending && confirmOrderMutation.variables?.purchaseOrderId === order.id}
            >
              {`Confirm ${order.poNumber}`}
            </Button>
          ),
        }),
      ),
    {
      key: 'inbound-delivery',
      action: PurchaseLegActionValues.CREATE_INBOUND_DELIVERY,
      element: (variant) => (
        <Button
          size="sm"
          variant={variant}
          permission={permissions.receive}
          startAdornment={<Truck className="size-4" />}
          onClick={inboundDeliveryDialog.open}
        >
          Create Inbound Delivery
        </Button>
      ),
    },
    {
      key: 'goods-receipt',
      action: PurchaseLegActionValues.CREATE_GOODS_RECEIPT,
      element: (variant) => (
        <Button
          size="sm"
          variant={variant}
          permission={permissions.receive}
          startAdornment={<PackageCheck className="size-4" />}
          onClick={goodsReceiptDialog.open}
        >
          Create Goods Receipt
        </Button>
      ),
    },
    {
      key: 'receive-with-invoice',
      action: PurchaseLegActionValues.RECEIVE_WITH_INVOICE,
      element: (variant) => (
        <Button
          size="sm"
          variant={variant}
          permission={permissions.receive}
          startAdornment={<ReceiptText className="size-4" />}
          onClick={() =>
            navigate(
              `${purchasesPath(workspace)}/receive-with-invoices/new${receiveWithInvoiceSearch({ supplierId: leg.supplierId, siteId })}`,
            )
          }
        >
          Receive with Invoice
        </Button>
      ),
    },
    {
      key: 'supplier-invoice',
      action: PurchaseLegActionValues.CREATE_SUPPLIER_INVOICE,
      element: (variant) => (
        <Button
          size="sm"
          variant={variant}
          permission={permissions.invoice}
          startAdornment={<FileText className="size-4" />}
          onClick={supplierInvoiceDialog.open}
        >
          Create Supplier Invoice
        </Button>
      ),
    },
  ];
  const buttons = allButtons.filter((button) => isAvailable(button.action));
  const secondary = buttons.filter((button) => button.action !== primaryAction);
  const primary = buttons.filter((button) => button.action === primaryAction);

  return (
    <>
      {isComingSoon && <Badge variant="secondary">Fulfilment coming soon</Badge>}
      {isAvailable(PurchaseLegActionValues.CLOSE_SUPPLIER) && (
        <Button
          size="sm"
          variant="outline"
          permission={permissions.close}
          startAdornment={<PackageX className="size-4" />}
          onClick={closeDialog.open}
          disabled={hasDrafts}
          disabledTip="Post or discard the supplier's draft receipts and invoices before closing it."
        >
          Close Supplier
        </Button>
      )}
      {secondary.map((button) => (
        <Fragment key={button.key}>{button.element('outline')}</Fragment>
      ))}
      {primary.map((button) => (
        <Fragment key={button.key}>{button.element('default')}</Fragment>
      ))}

      <Dialog
        handle={purchaseOrderDialog}
        icon={ShoppingCart}
        title={`Create Purchase Order for ${leg.supplierName}`}
        description="Raises one purchase order per currency from the supplier's allocations and sends it to the supplier."
        content={(close) => (
          <CreateLegPurchaseOrderDialog
            binding={binding}
            purchase={purchase}
            leg={leg}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
      <Dialog
        handle={inboundDeliveryDialog}
        icon={Truck}
        title={`Create Inbound Delivery from ${leg.supplierName}`}
        description="Records a shipment the supplier is sending against the confirmed orders, received when it arrives."
        className="max-w-2xl"
        content={(close) => (
          <CreateLegInboundDeliveryDialog
            binding={binding}
            purchase={purchase}
            leg={leg}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
      <Dialog
        handle={goodsReceiptDialog}
        icon={PackageCheck}
        title={`Create Goods Receipt from ${leg.supplierName}`}
        description="Starts a draft goods receipt, counted and posted in Goods Receipts."
        content={(close) => (
          <CreateLegGoodsReceiptDialog
            binding={binding}
            purchase={purchase}
            leg={leg}
            onSuccess={(received) => {
              close();
              navigate(goodsReceiptPath(workspace, { id: received.goodsReceiptId }));
            }}
            onCancel={close}
          />
        )}
      />
      <Dialog
        handle={supplierInvoiceDialog}
        icon={FileText}
        title={`Create Supplier Invoice for ${leg.supplierName}`}
        description="Drafts the supplier's invoice from what this purchase has received; it is checked and posted in its invoices."
        className="max-w-2xl"
        content={(close) => (
          <CreatePurchaseSupplierInvoiceDialog
            binding={binding}
            siteId={siteId}
            supplier={leg}
            purchaseIds={[purchase.id]}
            onSuccess={(invoice) => {
              close();
              navigate(`${workspace}/${binding.invoicePath(invoice)}`);
            }}
            onCancel={close}
          />
        )}
      />
      <Dialog
        handle={closeDialog}
        icon={PackageX}
        title={`Close ${leg.supplierName}?`}
        description="What is still open on the supplier's orders is marked delivery completed; nothing more is received or invoiced on it."
        content={(close) => (
          <CloseSupplierDialog binding={binding} purchase={purchase} leg={leg} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
