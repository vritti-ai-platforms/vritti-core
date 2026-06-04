import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
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
import { useCreateGoodsReceipt } from '@/hooks/goods-receipts/useCreateGoodsReceipt';
import {
  type CreateGoodsReceiptFormData,
  createGoodsReceiptSchema,
  type GoodsReceiptData,
} from '@/schemas/goods-receipts';

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

  // Reset PO + currency captures when supplier changes (the PO field gets disabled until a
  // supplier is picked anyway, but we also wipe stale state from the previous supplier).
  useEffect(() => {
    form.setValue('purchaseOrderId', '');
    setPoSelection(null);
  }, [form]);

  // Compute exchange-rate UX once we know supplier/PO context:
  //   - sameCurrency → field hidden; server resolves rate = 1.
  //   - PO FIXED     → field shown read-only with the locked rate; submit omits it (server reads PO).
  //   - else         → field shown editable, required (VARIABLE PO or un-linked GR with foreign supplier).
  const sameCurrency = !!supplierCurrencyCode && supplierCurrencyCode === buCurrencyCode;
  const showRateField = !!supplierCurrencyCode && !sameCurrency;
  const fixedFromPo = !!poSelection && poSelection.exchangeRateType === 'FIXED';

  // When a FIXED-rate PO is picked, mirror its rate into the form field so the user sees it; the
  // field is read-only and the submit ignores it (server takes the rate from the PO row itself).
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
        purchaseOrderId: data.purchaseOrderId || undefined,
        receivedDate: data.receivedDate,
        notes: data.notes,
        // Only send the user-supplied rate when applicable. Hidden + FIXED-from-PO cases let the
        // server resolve it (1 or PO rate respectively).
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
              : 'Required — supplier currency differs from your business unit currency.'
          }
        />
      )}
      <DatePicker name="receivedDate" label="Received Date" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Draft
        </Button>
      </div>
    </Form>
  );
};
