import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import type { SelectOption, SelectValue } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { Trash2 } from 'lucide-react';
import type React from 'react';
import { useMemo, useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  type AddInboundDeliveryLinesFormData,
  buildAddInboundDeliveryLinesSchema,
  type DeliverablePurchaseOrderLine,
} from '@/schemas/inbound-deliveries';
import { DeliverablePurchaseOrderItemSelector } from '@/selectors/deliverable-purchase-order-item';
import type { InboundDeliveryMutationsBinding } from '../../../bindings';

interface AddInboundDeliveryLinesDialogProps {
  mutations: InboundDeliveryMutationsBinding;
  deliveryId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Reads what a picked purchase order line still has to deliver from its option
function toDeliverableLine(option: SelectOption): DeliverablePurchaseOrderLine {
  const additionals = option.additionals ?? {};
  return {
    purchaseOrderItemId: String(option.value),
    inventoryItemName: option.label,
    poNumber: String(additionals.poNumber ?? option.description ?? ''),
    uomSymbol: String(additionals.uomSymbol ?? ''),
    allowDecimal: additionals.allowDecimal === true,
    orderedQty: Number(additionals.orderedQty ?? 0),
    receivedQty: Number(additionals.receivedQty ?? 0),
    deliverableQty: Number(additionals.deliverableQty ?? 0),
  };
}

// Puts open lines of the supplier's purchase orders at the site on the delivery in one batch, each with the quantity
// coming — by default all that is left to deliver of it
export const AddInboundDeliveryLinesDialog: React.FC<AddInboundDeliveryLinesDialogProps> = ({
  mutations,
  deliveryId,
  onSuccess,
  onCancel,
}) => {
  const fmt = useFormatters();
  // Every option seen in the picker, so a picked line keeps its counts while the picker searches elsewhere
  const pickedLinesRef = useRef(new Map<string, DeliverablePurchaseOrderLine>());
  const schema = useMemo(
    () => buildAddInboundDeliveryLinesSchema((purchaseOrderItemId) => pickedLinesRef.current.get(purchaseOrderItemId)),
    [],
  );
  const form = useForm<AddInboundDeliveryLinesFormData>({
    resolver: zodResolver(schema),
    defaultValues: { lines: [] },
  });
  const lineFields = useFieldArray({ control: form.control, name: 'lines' });
  const addLinesMutation = mutations.useAddLines({ onSuccess });
  const linesError = form.formState.errors.lines;
  const pickerError = linesError?.message ?? linesError?.root?.message;

  // Remembers the counts of the options the picker reports as selected
  const handleOptionsSelect = (options: SelectOption[]) => {
    for (const option of options) {
      pickedLinesRef.current.set(String(option.value), toDeliverableLine(option));
    }
  };

  // Keeps the quantity of lines still picked and starts a newly picked one at all that is left to deliver of it
  const handlePick = (values: SelectValue[]) => {
    const current = form.getValues('lines');
    lineFields.replace(
      values.map((value) => {
        const purchaseOrderItemId = String(value);
        return (
          current.find((line) => line.purchaseOrderItemId === purchaseOrderItemId) ?? {
            purchaseOrderItemId,
            quantity: pickedLinesRef.current.get(purchaseOrderItemId)?.deliverableQty ?? 0,
          }
        );
      }),
    );
    if (values.length > 0) form.clearErrors('lines');
  };

  return (
    <Form
      form={form}
      mutation={addLinesMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: deliveryId, lines: data.lines })}
    >
      <DeliverablePurchaseOrderItemSelector
        multiple
        params={{ inboundDeliveryId: deliveryId }}
        value={lineFields.fields.map((field) => field.purchaseOrderItemId)}
        onChange={handlePick}
        onOptionsSelect={handleOptionsSelect}
        error={pickerError}
      />
      <div className="flex flex-col gap-3">
        {lineFields.fields.map((field, index) => {
          const line = pickedLinesRef.current.get(field.purchaseOrderItemId);
          const unit = line?.uomSymbol ? ` ${line.uomSymbol}` : '';
          return (
            <div key={field.id} className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-medium text-sm">
                  {line?.inventoryItemName ?? field.purchaseOrderItemId}
                </span>
                <span className="text-muted-foreground text-xs">
                  {line &&
                    `${line.poNumber} · ${fmt.number(line.deliverableQty).primary}${unit} left to deliver of ${fmt.number(line.orderedQty).primary}${unit}`}
                </span>
              </div>
              <div className="w-40">
                <TextField
                  name={`lines.${index}.quantity`}
                  placeholder={`Quantity${unit}`}
                  type="number"
                  integer={!line?.allowDecimal}
                  positive
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
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Lines
        </Button>
      </DialogActions>
    </Form>
  );
};
