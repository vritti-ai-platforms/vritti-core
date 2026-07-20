import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { format } from '@vritti/quantum-ui/date-fns';
import { Form } from '@vritti/quantum-ui/Form';
import { useBUCurrency } from '@vritti/quantum-ui/hooks';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { PurchaseOrderSelector } from '@vritti/quantum-ui/selects/purchase-order';
import { SupplierSelector } from '@vritti/quantum-ui/selects/supplier';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  type CreateGoodsReceiptFormData,
  createGoodsReceiptSchema,
  type GoodsReceiptData,
} from '@/schemas/goods-receipts';
import { useCreateGoodsReceipt } from '@/hooks/site/goods-receipts/useCreateGoodsReceipt';

interface CreateGoodsReceiptDialogProps {
  onSuccess: (receipt: GoodsReceiptData) => void;
  onCancel: () => void;
}

interface PoSelection {
  currencyCode: string;
  exchangeRate: number;
  exchangeRateType: 'FIXED' | 'VARIABLE';
}

export const CreateGoodsReceiptDialog: React.FC<CreateGoodsReceiptDialogProps> = ({ onSuccess, onCancel }) => {
  const buCurrencyCode = useBUCurrency();
  const form = useForm<CreateGoodsReceiptFormData>({
    resolver: zodResolver(createGoodsReceiptSchema),
    defaultValues: {
      supplierId: '',
      purchaseOrderId: '',
      receivedDate: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
      exchangeRate: undefined,
    },
  });

  const createMutation = useCreateGoodsReceipt(null, {
    onSuccess: (data) => onSuccess(data),
  });
  const supplierId = form.watch('supplierId');
  const [supplierCurrencyCode, setSupplierCurrencyCode] = useState<string | null>(null);
  const [poSelection, setPoSelection] = useState<PoSelection | null>(null);

  // Reset PO + currency captures when supplier changes, wiping stale state from the previous supplier.
  useEffect(() => {
    form.setValue('purchaseOrderId', '');
    setPoSelection(null);
  }, [form]);

  // Exchange-rate UX by context: sameCurrency hides the field, FIXED PO shows it read-only, else editable+required.
  const sameCurrency = !!supplierCurrencyCode && supplierCurrencyCode === buCurrencyCode;
  const showRateField = !!supplierCurrencyCode && !sameCurrency;
  const fixedFromPo = !!poSelection && poSelection.exchangeRateType === 'FIXED';

  // When a FIXED-rate PO is picked, mirror its rate into the read-only field for display; submit ignores it.
  useEffect(() => {
    if (fixedFromPo && poSelection) {
      form.setValue('exchangeRate', poSelection.exchangeRate, { shouldValidate: false });
    } else if (!showRateField) {
      form.setValue('exchangeRate', undefined, { shouldValidate: false });
    }
  }, [form, fixedFromPo, poSelection, showRateField]);

  const handleSupplierSelect = (option: SelectOption | null) => {
    const code = typeof option?.additionals?.currencyCode === 'string' ? option.additionals.currencyCode : null;
    setSupplierCurrencyCode(code);
  };

  const handlePoSelect = (option: SelectOption | null) => {
    if (!option) {
      setPoSelection(null);
      return;
    }
    const a = option.additionals;
    const currencyCode = typeof a?.currencyCode === 'string' ? a.currencyCode : null;
    const exchangeRate = typeof a?.exchangeRate === 'number' ? a.exchangeRate : null;
    const exchangeRateType =
      a?.exchangeRateType === 'FIXED' || a?.exchangeRateType === 'VARIABLE' ? a.exchangeRateType : null;
    if (!currencyCode || exchangeRate == null || !exchangeRateType) {
      setPoSelection(null);
      return;
    }
    setPoSelection({ currencyCode, exchangeRate, exchangeRateType });
  };

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierId: data.supplierId,
        purchaseOrderId: data.purchaseOrderId,
        receivedDate: data.receivedDate,
        notes: data.notes,
        // Only send the user-supplied rate when applicable; hidden + FIXED-from-PO let the server resolve it.
        exchangeRate: showRateField && !fixedFromPo ? data.exchangeRate : undefined,
      })}
    >
      <SupplierSelector
        name="supplierId"
        label="Supplier"
        placeholder="Select supplier"
        onOptionSelect={handleSupplierSelect}
      />
      <PurchaseOrderSelector
        name="purchaseOrderId"
        label="Purchase Order (Optional)"
        placeholder="Select purchase order"
        disabled={!supplierId}
        params={
          supplierId
            ? { status: 'CONFIRMED,PARTIALLY_RECEIVED', supplierId }
            : { status: 'CONFIRMED,PARTIALLY_RECEIVED' }
        }
        onOptionSelect={handlePoSelect}
      />
      {showRateField && (
        <TextField
          name="exchangeRate"
          label={`Exchange Rate (${supplierCurrencyCode} → ${buCurrencyCode})`}
          type="number"
          positive
          disabled={fixedFromPo}
          description={
            fixedFromPo
              ? 'Locked from the purchase order (FIXED rate).'
              : 'Required — supplier currency differs from your site currency.'
          }
        />
      )}
      <DatePicker name="receivedDate" label="Received Date" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Draft
        </Button>
      </DialogActions>
    </Form>
  );
};
