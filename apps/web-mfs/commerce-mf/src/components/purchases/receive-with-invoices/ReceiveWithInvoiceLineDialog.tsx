import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DetailField, DetailSection } from '@vritti/quantum-ui/DetailField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useFormatters, useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { Select, type SelectOption } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { purchaseTypeConfig } from '@/schemas/purchases';
import {
  buildReceiveWithInvoiceLineSchema,
  type ReceiveWithInvoiceLineFormData,
  type ReceiveWithInvoiceLineFormValues,
  type ReceiveWithInvoiceOpenLine,
} from '@/schemas/receive-with-invoices';
import { LocationSelector } from '@/selectors/location';
import type { PurchasesBinding } from '../bindings';

interface ReceiveWithInvoiceLineDialogProps {
  binding: PurchasesBinding;
  openLines: ReceiveWithInvoiceOpenLine[];
  currencyCode: string;
  siteId?: string;
  line?: ReceiveWithInvoiceLineFormValues;
  onSave: (line: ReceiveWithInvoiceLineFormData) => void;
  onCancel: () => void;
}

// One line of the invoice: the open allocation it receives, how much (and how much free) in the allocation's unit, its
// unit price, discount and tax in the invoice currency, the batch it arrives in when the item is batch-tracked, and
// where it is put when not at the invoice's default location
export const ReceiveWithInvoiceLineDialog: React.FC<ReceiveWithInvoiceLineDialogProps> = ({
  binding,
  openLines,
  currencyCode,
  siteId,
  line,
  onSave,
  onCancel,
}) => {
  const fmt = useFormatters();
  const leCurrencyCode = useWorkspaceCurrency();
  const canSetMrp = usePermission(binding.mrpEditPermission).available;
  const openLinesById = useMemo(() => new Map(openLines.map((open) => [open.allocationId, open])), [openLines]);
  const schema = useMemo(
    () => buildReceiveWithInvoiceLineSchema({ findOpenLine: (id) => openLinesById.get(id), mrpRequired: canSetMrp }),
    [openLinesById, canSetMrp],
  );
  const form = useForm<ReceiveWithInvoiceLineFormValues, unknown, ReceiveWithInvoiceLineFormData>({
    resolver: zodResolver(schema),
    defaultValues: line ?? { freeQty: 0, lotNumber: '' },
  });
  const allocationId = useWatch({ control: form.control, name: 'allocationId' });
  const picked = allocationId ? openLinesById.get(allocationId) : undefined;

  const options = useMemo<SelectOption[]>(
    () =>
      openLines.map((open) => ({
        value: open.allocationId,
        label: open.inventoryItemName,
        description: [
          open.purchaseNumber,
          `${fmt.number(open.openQty).primary}${open.uomSymbol ? ` ${open.uomSymbol}` : ''} left to receive`,
        ].join(' · '),
      })),
    [openLines, fmt],
  );

  // A newly picked allocation starts at all that is left of it, at its sourced unit price when that is in the invoice currency
  const handleAllocationSelect = (option: SelectOption | null) => {
    const open = option ? openLinesById.get(String(option.value)) : undefined;
    if (!open || line) return;
    if (!form.getFieldState('quantity').isDirty) form.setValue('quantity', open.openQty);
    if (open.isPriced && open.unitPrice.currency === currencyCode && !form.getFieldState('unitPrice').isDirty) {
      form.setValue('unitPrice', open.unitPrice);
    }
  };

  const unit = picked?.uomSymbol ? ` (${picked.uomSymbol})` : '';

  return (
    <Form form={form} onSubmit={onSave} onCancel={onCancel}>
      <FormSection title="Item" contentClassName="block">
        <Select
          name="allocationId"
          label="Item"
          placeholder="Select what the invoice brings"
          searchable
          options={options}
          onOptionSelect={handleAllocationSelect}
          description="The supplier's open allocations of purchases at this site that are received with the invoice"
        />
      </FormSection>

      {picked && (
        <DetailSection wrap>
          <DetailField className="px-4 py-2" label="Purchase" type="string" mono value={picked.purchaseNumber} />
          <DetailField
            className="px-4 py-2"
            label="Type"
            type="string"
            value={purchaseTypeConfig[picked.legType].label}
          />
          <DetailField className="px-4 py-2" label={`Allocated${unit}`} type="number" value={picked.allocatedQty} />
          <DetailField className="px-4 py-2" label={`Received${unit}`} type="number" value={picked.receivedQty} />
          <DetailField className="px-4 py-2" label={`Left to Receive${unit}`} type="number" value={picked.openQty} />
          {picked.isPriced && (
            <DetailField className="px-4 py-2" label="Sourced Unit Price" type="currency" value={picked.unitPrice} />
          )}
        </DetailSection>
      )}

      <FormSection title="Quantity" description="In the allocation's unit; free goods come on top of what is invoiced">
        <TextField name="quantity" label={`Quantity${unit}`} type="number" positive nonZero placeholder="e.g. 20" />
        <TextField name="freeQty" label={`Free${unit}`} type="number" positive placeholder="e.g. 2" />
      </FormSection>

      <FormSection title="Amounts">
        <CurrencyField name="unitPrice" label="Unit Price" currencyCode={currencyCode} />
        <CurrencyField name="discountAmount" label="Discount (optional)" currencyCode={currencyCode} />
        <CurrencyField name="taxAmount" label="Tax (optional)" currencyCode={currencyCode} />
      </FormSection>

      {picked?.isLotTracked && (
        <FormSection title="Batch" description="As printed on the pack; MRP per primary unit">
          <TextField name="lotNumber" label="Batch" placeholder="e.g. B2611A" />
          <DatePicker name="expiryDate" label="Expiry" />
          <DatePicker name="manufacturingDate" label="Manufactured (optional)" />
          <CurrencyField
            name="mrp"
            label={`MRP${picked.primaryUomSymbol ? ` per ${picked.primaryUomSymbol}` : ''}`}
            currencyCode={leCurrencyCode}
            permission={binding.mrpEditPermission}
          />
        </FormSection>
      )}

      <FormSection title="Location" contentClassName="block">
        <LocationSelector
          name="locationId"
          label="Location (optional)"
          clearable
          params={siteId ? binding.locationParams?.(siteId) : undefined}
          description="Otherwise the invoice's default location"
        />
      </FormSection>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">{line ? 'Save Line' : 'Add Line'}</Button>
      </DialogActions>
    </Form>
  );
};
