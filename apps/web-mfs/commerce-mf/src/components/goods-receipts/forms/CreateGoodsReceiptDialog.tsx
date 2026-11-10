import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useWorkspaceTimeZone } from '@vritti/quantum-ui/hooks';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { isoTodayDate } from '@vritti/quantum-ui/timezone';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  type CreateGoodsReceiptFromDeliveryFormData,
  type CreateGoodsReceiptFromPurchaseOrdersFormData,
  createGoodsReceiptFromDeliverySchema,
  createGoodsReceiptFromPurchaseOrdersSchema,
  type GoodsReceiptCreatePath,
  type GoodsReceiptData,
} from '@/schemas/goods-receipts';
import { ReceivableInboundDeliverySelector } from '@/selectors/receivable-inbound-delivery';
import { ReceivablePurchaseOrderSelector } from '@/selectors/receivable-purchase-order';
import { SupplierSelector } from '@/selectors/supplier';
import type { UseCreateGoodsReceiptFromDelivery, UseCreateGoodsReceiptFromPurchaseOrders } from '../types';

interface CreateGoodsReceiptMutations {
  useCreateFromDelivery: UseCreateGoodsReceiptFromDelivery;
  useCreateFromPurchaseOrders: UseCreateGoodsReceiptFromPurchaseOrders;
}

interface PreselectedPurchaseOrder {
  id: string;
  supplierId: string;
}

interface CreateGoodsReceiptDialogProps {
  mutations: CreateGoodsReceiptMutations;
  purchaseOrder?: PreselectedPurchaseOrder;
  onSuccess: (receipt: GoodsReceiptData) => void;
  onCancel: () => void;
}

interface PathFormProps {
  mutations: CreateGoodsReceiptMutations;
  onSuccess: (receipt: GoodsReceiptData) => void;
  onCancel: () => void;
}

const PATH_OPTIONS: { value: GoodsReceiptCreatePath; label: string; description: string }[] = [
  {
    value: 'DELIVERY',
    label: 'Inbound delivery',
    description: "Receive a delivery the supplier announced; the receipt carries that delivery's open lines.",
  },
  {
    value: 'PURCHASE_ORDERS',
    label: 'No inbound delivery',
    description: "Goods arrived unannounced; pick the supplier's purchase orders and every open line is received.",
  },
];

// Receives an announced inbound delivery: the draft carries the delivery's open lines
const FromDeliveryForm: React.FC<PathFormProps> = ({ mutations, onSuccess, onCancel }) => {
  const timeZone = useWorkspaceTimeZone();
  const form = useForm<CreateGoodsReceiptFromDeliveryFormData>({
    resolver: zodResolver(createGoodsReceiptFromDeliverySchema),
    defaultValues: { receivedDate: isoTodayDate(timeZone), notes: '' },
  });
  const mutation = mutations.useCreateFromDelivery({ onSuccess: (response) => onSuccess(response.data) });

  return (
    <Form
      form={form}
      mutation={mutation}
      transformSubmit={(data) => ({ ...data, notes: data.notes.trim() || undefined })}
      onCancel={onCancel}
    >
      <ReceivableInboundDeliverySelector
        name="inboundDeliveryId"
        description="Announced deliveries that are still open and have no draft receipt"
      />
      <DatePicker name="receivedDate" label="Received Date" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Draft
        </Button>
      </DialogActions>
    </Form>
  );
};

// Receives goods that arrived without an announced delivery: an arrived delivery is created with the draft, both
// carrying every open line of the picked purchase orders
const FromPurchaseOrdersForm: React.FC<PathFormProps & { purchaseOrder?: PreselectedPurchaseOrder }> = ({
  mutations,
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const timeZone = useWorkspaceTimeZone();
  const form = useForm<CreateGoodsReceiptFromPurchaseOrdersFormData>({
    resolver: zodResolver(createGoodsReceiptFromPurchaseOrdersSchema),
    defaultValues: {
      ...(purchaseOrder ? { supplierId: purchaseOrder.supplierId, purchaseOrderIds: [purchaseOrder.id] } : {}),
      carrier: '',
      trackingNumber: '',
      supplierDeliveryNoteNumber: '',
      receivedDate: isoTodayDate(timeZone),
      notes: '',
    },
  });
  const mutation = mutations.useCreateFromPurchaseOrders({ onSuccess: (response) => onSuccess(response.data) });
  const supplierId = form.watch('supplierId');

  return (
    <Form
      form={form}
      mutation={mutation}
      transformSubmit={(data) => ({
        ...data,
        carrier: data.carrier.trim() || undefined,
        trackingNumber: data.trackingNumber.trim() || undefined,
        supplierDeliveryNoteNumber: data.supplierDeliveryNoteNumber.trim() || undefined,
        supplierDeliveryNoteDate: data.supplierDeliveryNoteDate || undefined,
        notes: data.notes.trim() || undefined,
      })}
      onCancel={onCancel}
    >
      <SupplierSelector
        name="supplierId"
        disabled={!!purchaseOrder}
        onOptionSelect={() => form.resetField('purchaseOrderIds')}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField name="carrier" label="Carrier" placeholder="Optional" />
        <TextField name="trackingNumber" label="Tracking Number" placeholder="Optional" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          name="supplierDeliveryNoteNumber"
          label="Supplier Delivery Note No."
          placeholder="Optional challan number"
        />
        <DatePicker name="supplierDeliveryNoteDate" label="Delivery Note Date" />
      </div>
      <ReceivablePurchaseOrderSelector
        name="purchaseOrderIds"
        label="Purchase Orders"
        description="The supplier's confirmed or partially received orders with something left to receive"
        multiple
        supplierId={supplierId}
      />
      <DatePicker name="receivedDate" label="Received Date" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Draft
        </Button>
      </DialogActions>
    </Form>
  );
};

// Starts a draft goods receipt, either of an announced inbound delivery or of purchase orders whose goods arrived
// without one; a preselected purchase order goes straight to the purchase orders path
export const CreateGoodsReceiptDialog: React.FC<CreateGoodsReceiptDialogProps> = ({
  mutations,
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const [path, setPath] = useState<GoodsReceiptCreatePath>(purchaseOrder ? 'PURCHASE_ORDERS' : 'DELIVERY');

  return (
    <div className="flex flex-col gap-6">
      {!purchaseOrder && (
        <RadioGroup
          label="How did the goods arrive?"
          variant="card"
          options={PATH_OPTIONS}
          value={path}
          onValueChange={(value) => setPath(value as GoodsReceiptCreatePath)}
        />
      )}
      {path === 'DELIVERY' ? (
        <FromDeliveryForm mutations={mutations} onSuccess={onSuccess} onCancel={onCancel} />
      ) : (
        <FromPurchaseOrdersForm
          mutations={mutations}
          purchaseOrder={purchaseOrder}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      )}
    </div>
  );
};
