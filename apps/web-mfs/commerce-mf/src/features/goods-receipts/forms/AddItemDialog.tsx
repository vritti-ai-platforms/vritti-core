import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { minorToMajor } from '@vritti/quantum-ui/money';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { PurchaseOrderItemSelector } from '@vritti/quantum-ui/selects/purchase-order-item';
import { SupplierItemSelector } from '@vritti/quantum-ui/selects/supplier-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useAddGoodsReceiptItemFromPurchaseOrderItem,
  useAddGoodsReceiptItemFromSupplierItem,
} from '@/hooks/goods-receipts';
import {
  type AddGoodsReceiptItemFromPurchaseOrderItemFormData,
  type AddGoodsReceiptItemFromSupplierItemFormData,
  buildAddGoodsReceiptItemFromPurchaseOrderItemSchema,
  buildAddGoodsReceiptItemFromSupplierItemSchema,
  type FreeSchemeMode,
  freeSchemeModeLabels,
} from '@/schemas/goods-receipts';

const schemeModeOptions = (Object.keys(freeSchemeModeLabels) as FreeSchemeMode[]).map((mode) => ({
  value: mode,
  label: freeSchemeModeLabels[mode],
}));

const toOptionalNumber = (raw: unknown): number | undefined => {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

interface AddItemDialogContext {
  goodsReceiptId: string;
  supplierId: string;
  // Supplier (transaction) currency — GR-item prices are entered in this, not the BU currency.
  supplierCurrencyCode: string;
  poId?: string | null;
}

// Two flows, kept side-by-side instead of a single mega-form, because the picker name, mutation
// hook, and zod schema all differ between them. Sharing only the visual chrome (quantity + price +
// rejected qty + buttons) is cheaper than collapsing the divergent identity into one schema.

const SupplierItemForm = ({
  goodsReceiptId,
  supplierId,
  supplierCurrencyCode,
  onSuccess,
  onCancel,
}: Pick<AddItemDialogContext, 'goodsReceiptId' | 'supplierId' | 'supplierCurrencyCode'> & {
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  // `allowDecimal` drives the quantity/rejected inputs — a UOM property of the picked row, not form state.
  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);
  // Schema depends on the selected row's allowDecimal, known only after select — keep the resolver
  // pointed at the latest build via a ref so the dynamic integer rule applies without a remount.
  const schema = useMemo(() => buildAddGoodsReceiptItemFromSupplierItemSchema({ allowDecimal }), [allowDecimal]);
  const schemaRef = useRef(schema);
  schemaRef.current = schema;
  const form = useForm<AddGoodsReceiptItemFromSupplierItemFormData>({
    resolver: (values, context, options) => zodResolver(schemaRef.current)(values, context, options),
    defaultValues: {
      supplierItemId: '',
      orderedQty: 0,
      rejectedQuantity: undefined,
      unitPrice: undefined,
      schemeBuyQty: undefined,
      schemeFreeQty: undefined,
      schemeMode: 'none',
    },
  });
  const mutation = useAddGoodsReceiptItemFromSupplierItem(goodsReceiptId, { onSuccess });

  const handleSelect = (option: SelectOption | null) => {
    setAllowDecimal(option?.additionals?.allowDecimal === true);
    const rawMinor = option?.additionals?.unitPrice;
    if (rawMinor) {
      form.setValue('unitPrice', {
        currency: supplierCurrencyCode,
        value: minorToMajor(rawMinor.toString(), supplierCurrencyCode),
      });
    }
    // Prefill the standing scheme from the supplier item; operator can edit.
    form.setValue('schemeBuyQty', toOptionalNumber(option?.additionals?.schemeBuyQty));
    form.setValue('schemeFreeQty', toOptionalNumber(option?.additionals?.schemeFreeQty));
    form.setValue('schemeMode', (option?.additionals?.schemeMode as FreeSchemeMode | undefined) ?? 'none');
  };

  const supplierItemId = form.watch('supplierItemId');
  const schemeMode = form.watch('schemeMode');

  return (
    <Form form={form} mutation={mutation} onCancel={onCancel}>
      <div className="flex flex-col gap-6">
        <FormSection title="Item">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <SupplierItemSelector
                name="supplierItemId"
                params={{ supplierId, excludeOnGoodsReceiptId: goodsReceiptId }}
                onOptionSelect={handleSelect}
              />
            </div>
            <CurrencyField
              name="unitPrice"
              label="Unit Price"
              currencyCode={supplierCurrencyCode}
              disabled={!supplierItemId}
              disabledTip="Pick an item first."
            />
          </div>
        </FormSection>

        <FormSection title="Received">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField name="orderedQty" label="Ordered Qty" type="number" integer={!allowDecimal} positive />
            <TextField
              name="rejectedQuantity"
              label="Damaged on Arrival"
              description="Optional. Items that arrived damaged or unusable."
              type="number"
              integer={!allowDecimal}
              positive
            />
          </div>
        </FormSection>

        <FormSection title="Free Goods Scheme">
          <div className="flex flex-col gap-4">
            <RadioGroup name="schemeMode" label="Scheme" options={schemeModeOptions} orientation="horizontal" />
            {schemeMode !== 'none' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField name="schemeBuyQty" label="Buy Qty" type="number" positive />
                <TextField name="schemeFreeQty" label="Free Qty" type="number" positive />
              </div>
            )}
          </div>
        </FormSection>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Add Item</Button>
      </div>
    </Form>
  );
};

const PurchaseOrderItemForm = ({
  goodsReceiptId,
  poId,
  supplierCurrencyCode,
  onSuccess,
  onCancel,
}: {
  goodsReceiptId: string;
  poId: string;
  supplierCurrencyCode: string;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);
  const [poRemaining, setPoRemaining] = useState<number | undefined>(undefined);
  const schema = useMemo(
    () => buildAddGoodsReceiptItemFromPurchaseOrderItemSchema({ allowDecimal, max: poRemaining }),
    [allowDecimal, poRemaining],
  );
  const schemaRef = useRef(schema);
  schemaRef.current = schema;
  const form = useForm<AddGoodsReceiptItemFromPurchaseOrderItemFormData>({
    resolver: (values, context, options) => zodResolver(schemaRef.current)(values, context, options),
    defaultValues: {
      purchaseOrderItemId: '',
      orderedQty: 0,
      rejectedQuantity: undefined,
      unitPrice: undefined,
      schemeBuyQty: undefined,
      schemeFreeQty: undefined,
      schemeMode: 'none',
    },
  });
  const mutation = useAddGoodsReceiptItemFromPurchaseOrderItem(goodsReceiptId, { onSuccess });

  const handleSelect = (option: SelectOption | null) => {
    setAllowDecimal(option?.additionals?.allowDecimal === true);
    // Prefill + cap the ordered (paid) qty at the PO line's remaining (ordered − received). Editable down.
    const ordered = Number(option?.additionals?.orderedQuantity ?? 0);
    const received = Number(option?.additionals?.receivedQuantity ?? 0);
    const remaining = Math.max(ordered - received, 0);
    setPoRemaining(remaining);
    form.setValue('orderedQty', remaining);
    const rawMinor = option?.additionals?.unitPrice;
    if (rawMinor) {
      form.setValue('unitPrice', {
        currency: supplierCurrencyCode,
        value: minorToMajor(rawMinor.toString(), supplierCurrencyCode),
      });
    }
    // Prefill the scheme from the PO line; operator can edit.
    form.setValue('schemeBuyQty', toOptionalNumber(option?.additionals?.schemeBuyQty));
    form.setValue('schemeFreeQty', toOptionalNumber(option?.additionals?.schemeFreeQty));
    form.setValue('schemeMode', (option?.additionals?.schemeMode as FreeSchemeMode | undefined) ?? 'none');
  };

  const purchaseOrderItemId = form.watch('purchaseOrderItemId');
  const schemeMode = form.watch('schemeMode');

  return (
    <Form form={form} mutation={mutation} onCancel={onCancel}>
      <div className="flex flex-col gap-6">
        <FormSection title="Item">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <PurchaseOrderItemSelector
                name="purchaseOrderItemId"
                label="Purchase Order Item"
                params={{ purchaseOrderId: poId, excludeOnGoodsReceiptId: goodsReceiptId }}
                onOptionSelect={handleSelect}
              />
            </div>
            <CurrencyField
              name="unitPrice"
              label="Unit Price"
              currencyCode={supplierCurrencyCode}
              disabled={!purchaseOrderItemId}
              disabledTip="Pick an item first."
            />
          </div>
        </FormSection>

        <FormSection title="Received">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              name="orderedQty"
              label="Ordered Qty"
              type="number"
              integer={!allowDecimal}
              positive
              max={poRemaining}
            />
            <TextField
              name="rejectedQuantity"
              label="Damaged on Arrival"
              description="Optional. Items that arrived damaged or unusable."
              type="number"
              integer={!allowDecimal}
              positive
            />
          </div>
        </FormSection>

        <FormSection title="Free Goods Scheme">
          <div className="flex flex-col gap-4">
            <RadioGroup name="schemeMode" label="Scheme" options={schemeModeOptions} orientation="horizontal" />
            {schemeMode !== 'none' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField name="schemeBuyQty" label="Buy Qty" type="number" positive />
                <TextField name="schemeFreeQty" label="Free Qty" type="number" positive />
              </div>
            )}
          </div>
        </FormSection>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Add Item</Button>
      </div>
    </Form>
  );
};

export const AddItemDialog = ({
  goodsReceiptId,
  supplierId,
  supplierCurrencyCode,
  poId,
  handle,
}: AddItemDialogContext & { handle: ReturnType<typeof useDialog> }) => (
  <Dialog
    handle={handle}
    className="max-w-3xl"
    title="Add Item"
    description={poId ? 'Add an item from the linked purchase order.' : 'Add an item to this goods receipt.'}
    content={(close) =>
      poId ? (
        <PurchaseOrderItemForm
          goodsReceiptId={goodsReceiptId}
          poId={poId}
          supplierCurrencyCode={supplierCurrencyCode}
          onSuccess={close}
          onCancel={close}
        />
      ) : (
        <SupplierItemForm
          goodsReceiptId={goodsReceiptId}
          supplierId={supplierId}
          supplierCurrencyCode={supplierCurrencyCode}
          onSuccess={close}
          onCancel={close}
        />
      )
    }
  />
);
