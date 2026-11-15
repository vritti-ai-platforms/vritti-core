import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import { DetailField, DetailSection } from '@vritti/quantum-ui/DetailField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Select, type SelectOption } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  buildSupplierInvoiceItemLineSchema,
  invoiceableGoodsReceiptKey,
  type SupplierInvoice,
  type SupplierInvoiceItemLineFormData,
  type SupplierInvoiceItemLinePayload,
  type SupplierInvoiceLine,
} from '@/schemas/supplier-invoices';
import type { SupplierInvoicesBinding } from '../bindings';
import { invoiceLineMrp } from '../lineMrp';

interface SupplierInvoiceItemLineDialogProps {
  binding: SupplierInvoicesBinding;
  invoice: SupplierInvoice;
  line?: SupplierInvoiceLine;
  onSuccess: () => void;
  onCancel: () => void;
}

// Invoices a received batch — one of the supplier's posted receipt lots at the invoice's site with quantity left to
// invoice — or edits what a line covers of one: quantities in the order line's unit and amounts in the invoice currency.
// The batch, expiry and MRP are the receipt's, never typed
export const SupplierInvoiceItemLineDialog: React.FC<SupplierInvoiceItemLineDialogProps> = ({
  binding,
  invoice,
  line,
  onSuccess,
  onCancel,
}) => {
  const fmt = useFormatters();
  const { data: receipts = [], isLoading } = binding.useInvoiceableGoodsReceipts(
    invoice,
    line ? { excludeLineId: line.id } : {},
  );
  const receiptsByKey = useMemo(
    () => new Map(receipts.map((receipt) => [invoiceableGoodsReceiptKey(receipt) ?? '', receipt])),
    [receipts],
  );
  const receiptsRef = useRef(receiptsByKey);
  useEffect(() => {
    receiptsRef.current = receiptsByKey;
  }, [receiptsByKey]);
  const schema = useMemo(() => buildSupplierInvoiceItemLineSchema((key) => receiptsRef.current.get(key)), []);

  const form = useForm<SupplierInvoiceItemLineFormData>({
    resolver: zodResolver(schema),
    defaultValues: line
      ? {
          receiptKey: invoiceableGoodsReceiptKey(line),
          purchaseOrderItemId: line.purchaseOrderItemId ?? undefined,
          goodsReceiptItemId: line.goodsReceiptItemId ?? undefined,
          goodsReceiptLotId: line.goodsReceiptLotId,
          invoicedQty: line.invoicedQty ?? undefined,
          freeQty: line.freeQty ?? 0,
          unitPrice: line.unitPrice,
          discountAmount: line.discountAmount,
          taxAmount: line.taxAmount,
          description: line.description ?? '',
        }
      : { freeQty: 0, description: '' },
  });
  const addMutation = binding.useAddLine({ onSuccess });
  const updateMutation = binding.useUpdateLine({ onSuccess });
  const receiptKey = useWatch({ control: form.control, name: 'receiptKey' });
  const picked = receiptKey ? receiptsByKey.get(receiptKey) : undefined;

  const options = useMemo<SelectOption[]>(
    () =>
      receipts.map((receipt) => ({
        value: invoiceableGoodsReceiptKey(receipt) ?? '',
        label: receipt.inventoryItemName,
        description: [
          receipt.grNumber,
          receipt.poNumber,
          receipt.lotNumber ? `Batch ${receipt.lotNumber}` : null,
          `${fmt.number(receipt.openQty).primary}${receipt.uomSymbol ? ` ${receipt.uomSymbol}` : ''} to invoice`,
        ]
          .filter(Boolean)
          .join(' · '),
      })),
    [receipts, fmt],
  );

  // A picked batch fills the order line, receipt item and lot it stands for; a new line starts at the order price for
  // all that is left to invoice of it
  const handleReceiptSelect = (option: SelectOption | null) => {
    const receipt = option ? receiptsByKey.get(String(option.value)) : undefined;
    if (!receipt) {
      form.resetField('purchaseOrderItemId');
      form.resetField('goodsReceiptItemId');
      form.resetField('goodsReceiptLotId');
      return;
    }
    form.setValue('purchaseOrderItemId', receipt.purchaseOrderItemId);
    form.setValue('goodsReceiptItemId', receipt.goodsReceiptItemId);
    form.setValue('goodsReceiptLotId', receipt.goodsReceiptLotId);
    if (line) return;
    if (!form.getFieldState('unitPrice').isDirty) form.setValue('unitPrice', receipt.poUnitPrice);
    if (!form.getFieldState('invoicedQty').isDirty) form.setValue('invoicedQty', receipt.openQty);
  };

  // The schema has already required the batch's ids and the unit price by the time the form submits
  const toPayload = (data: SupplierInvoiceItemLineFormData): SupplierInvoiceItemLinePayload => ({
    lineType: 'ITEM',
    purchaseOrderItemId: data.purchaseOrderItemId,
    goodsReceiptItemId: data.goodsReceiptItemId,
    goodsReceiptLotId: data.goodsReceiptLotId ?? null,
    invoicedQty: data.invoicedQty,
    freeQty: data.freeQty,
    unitPrice: data.unitPrice as CurrencyValue,
    discountAmount: data.discountAmount?.value ? data.discountAmount : undefined,
    taxAmount: data.taxAmount?.value ? data.taxAmount : undefined,
    description: data.description.trim() || undefined,
  });

  const unit = picked?.uomSymbol ? ` (${picked.uomSymbol})` : '';
  const body = (
    <>
      <div className="flex flex-col gap-6">
        <FormSection title="Received Batch" contentClassName="block">
          <Select
            name="receiptKey"
            label="Received Batch"
            placeholder={isLoading ? 'Loading receipts...' : 'Select a received batch'}
            searchable
            options={options}
            onOptionSelect={handleReceiptSelect}
            description="Posted receipts of the supplier's orders at this site with quantity left to invoice, oldest first"
          />
        </FormSection>

        {picked && (
          <DetailSection wrap>
            <DetailField className="px-4 py-2" label="Receipt" type="string" mono value={picked.grNumber} />
            <DetailField className="px-4 py-2" label="Received" type="date" value={picked.receivedDate} />
            <DetailField className="px-4 py-2" label="Purchase Order" type="string" mono value={picked.poNumber} />
            <DetailField className="px-4 py-2" label="Batch" type="string" mono value={picked.lotNumber} />
            <DetailField className="px-4 py-2" label="Expiry" type="date" value={picked.expiryDate} />
            <DetailField className="px-4 py-2" label="MRP" type="currency" value={invoiceLineMrp(picked)} />
            <DetailField className="px-4 py-2" label="Order Price" type="currency" value={picked.poUnitPrice} />
            <DetailField className="px-4 py-2" label={`Left to Invoice${unit}`} type="number" value={picked.openQty} />
            {picked.primaryUomSymbol && picked.primaryUomSymbol !== picked.uomSymbol && (
              <DetailField
                className="px-4 py-2"
                label={`Left to Invoice (${picked.primaryUomSymbol})`}
                type="number"
                value={picked.openPrimaryQty}
              />
            )}
          </DetailSection>
        )}

        <FormSection
          title="Quantity"
          description="In the order line's unit; invoiced and free together, at most what is left"
        >
          <TextField
            name="invoicedQty"
            label={`Invoiced Qty${unit}`}
            type="number"
            positive
            nonZero
            placeholder="e.g. 20"
          />
          <TextField name="freeQty" label={`Free Qty${unit}`} type="number" positive placeholder="e.g. 2" />
        </FormSection>

        <FormSection title="Amounts">
          <CurrencyField name="unitPrice" label="Unit Price" currencyCode={invoice.currencyCode} />
          <CurrencyField name="discountAmount" label="Discount (optional)" currencyCode={invoice.currencyCode} />
          <CurrencyField name="taxAmount" label="Tax (optional)" currencyCode={invoice.currencyCode} />
          <TextField name="description" label="Description (optional)" placeholder="As printed on the invoice" />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          {line ? 'Save Line' : 'Add Line'}
        </Button>
      </DialogActions>
    </>
  );

  return line ? (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ invoice, lineId: line.id, data: toPayload(data) })}
    >
      {body}
    </Form>
  ) : (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({ invoice, data: toPayload(data) })}
    >
      {body}
    </Form>
  );
};
