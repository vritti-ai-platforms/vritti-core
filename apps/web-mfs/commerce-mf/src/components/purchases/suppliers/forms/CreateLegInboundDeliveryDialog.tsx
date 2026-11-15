import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useFormatters, useWorkspaceTimeZone } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { isoTodayDate } from '@vritti/quantum-ui/timezone';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { Trash2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  buildPurchaseLegInboundDeliverySchema,
  type PurchaseAllocation,
  type PurchaseHeader,
  type PurchaseLeg,
  type PurchaseLegInboundDeliveryFormData,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';

interface CreateLegInboundDeliveryDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  leg: PurchaseLeg;
  onSuccess: () => void;
  onCancel: () => void;
}

// Creates an inbound delivery the supplier is sending: when it is expected, how it travels, its delivery note, and how much of
// each confirmed order line it carries — by default all that is still open for inbound delivery of it
export const CreateLegInboundDeliveryDialog: React.FC<CreateLegInboundDeliveryDialogProps> = ({
  binding,
  purchase,
  leg,
  onSuccess,
  onCancel,
}) => {
  const fmt = useFormatters();
  const timeZone = useWorkspaceTimeZone();
  const orderedAllocations = useMemo(
    () =>
      new Map(
        leg.allocations.flatMap((allocation): [string, PurchaseAllocation][] =>
          allocation.purchaseOrderItemId && allocation.openForInboundDeliveryQty > 0
            ? [[allocation.purchaseOrderItemId, allocation]]
            : [],
        ),
      ),
    [leg.allocations],
  );
  const schema = useMemo(
    () => buildPurchaseLegInboundDeliverySchema((id) => orderedAllocations.get(id)?.openForInboundDeliveryQty),
    [orderedAllocations],
  );
  const form = useForm<PurchaseLegInboundDeliveryFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      expectedDeliveryDate: isoTodayDate(timeZone),
      carrier: '',
      trackingNumber: '',
      supplierDeliveryNoteNumber: '',
      lines: [...orderedAllocations].map(([purchaseOrderItemId, allocation]) => ({
        purchaseOrderItemId,
        quantity: allocation.openForInboundDeliveryQty,
      })),
    },
  });
  const lineFields = useFieldArray({ control: form.control, name: 'lines' });
  const inboundDeliveryMutation = binding.useCreateLegInboundDelivery({ onSuccess });
  const linesError = form.formState.errors.lines?.message ?? form.formState.errors.lines?.root?.message;

  return (
    <Form
      form={form}
      mutation={inboundDeliveryMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchase.id,
        legId: leg.id,
        expectedDeliveryDate: data.expectedDeliveryDate,
        carrier: data.carrier.trim() || undefined,
        trackingNumber: data.trackingNumber.trim() || undefined,
        supplierDeliveryNoteNumber: data.supplierDeliveryNoteNumber.trim() || undefined,
        supplierDeliveryNoteDate: data.supplierDeliveryNoteDate || undefined,
        lines: data.lines,
      })}
    >
      <FormSection title="Delivery">
        <DatePicker name="expectedDeliveryDate" label="Expected Delivery" />
        <TextField name="carrier" label="Carrier (optional)" placeholder="e.g. Blue Dart" />
        <TextField name="trackingNumber" label="Tracking Number (optional)" />
        <TextField name="supplierDeliveryNoteNumber" label="Delivery Note No. (optional)" />
        <DatePicker name="supplierDeliveryNoteDate" label="Delivery Note Date (optional)" />
      </FormSection>
      <FormSection
        title="Lines"
        description="How much of each confirmed order line the delivery carries; at most what is still open for inbound delivery"
        contentClassName="flex flex-col gap-3"
      >
        {lineFields.fields.map((field, index) => {
          const allocation = orderedAllocations.get(field.purchaseOrderItemId);
          const unit = allocation?.uomSymbol ? ` ${allocation.uomSymbol}` : '';
          return (
            <div key={field.id} className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Typography variant="body2" className="truncate font-medium">
                  {allocation?.inventoryItemName}
                </Typography>
                <Typography variant="caption" intent="muted">
                  {allocation &&
                    `${fmt.number(allocation.openForInboundDeliveryQty).primary}${unit} open for inbound delivery of ${fmt.number(allocation.uomQty).primary}${unit} ordered`}
                </Typography>
              </div>
              <div className="w-40">
                <TextField
                  name={`lines.${index}.quantity`}
                  placeholder={`Quantity${unit}`}
                  type="number"
                  positive
                  nonZero
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                aria-label="Remove line"
                onClick={() => lineFields.remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        })}
        {linesError && (
          <Typography variant="caption" intent="error">
            {linesError}
          </Typography>
        )}
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Inbound Delivery
        </Button>
      </DialogActions>
    </Form>
  );
};
