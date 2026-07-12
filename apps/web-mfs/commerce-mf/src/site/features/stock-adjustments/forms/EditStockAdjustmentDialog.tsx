import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useBUCurrency } from '@vritti/quantum-ui/hooks';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useForm } from 'react-hook-form';
import {
  type StockAdjustmentType,
  type UpdateStockAdjustmentFormData,
  updateStockAdjustmentSchema,
} from '@/schemas/stock-adjustments';
import { useUpdateStockAdjustment } from '@/site/hooks/stock-adjustments';

interface EditStockAdjustmentDialogProps {
  adjustmentId: string;
  reason: string | null;
  type: StockAdjustmentType;
  unitCost: { currency: string; value: string } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditStockAdjustmentDialog = ({
  adjustmentId,
  reason,
  type,
  unitCost,
  onSuccess,
  onCancel,
}: EditStockAdjustmentDialogProps) => {
  const buCurrencyCode = useBUCurrency();
  const isOpeningStock = type === 'OPENING_STOCK';
  const form = useForm<UpdateStockAdjustmentFormData>({
    resolver: zodResolver(updateStockAdjustmentSchema),
    defaultValues: { reason: reason ?? '', unitCost: unitCost ?? undefined },
  });

  const updateMutation = useUpdateStockAdjustment(adjustmentId, { onSuccess: () => onSuccess() });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        reason: data.reason,
        unitCost: isOpeningStock ? data.unitCost : undefined,
      })}
    >
      <TextArea name="reason" label="Reason" placeholder="Enter reason for adjustment" />
      {isOpeningStock && (
        <CurrencyField
          name="unitCost"
          label="Unit Cost"
          description="Cost per primary unit, in your base currency. Used to value the opening stock."
          currencyCode={buCurrencyCode ?? undefined}
        />
      )}

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save
        </Button>
      </DialogActions>
    </Form>
  );
};
