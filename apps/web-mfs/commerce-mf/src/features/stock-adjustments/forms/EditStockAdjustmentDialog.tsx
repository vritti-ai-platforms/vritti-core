import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useForm } from 'react-hook-form';
import { useUpdateStockAdjustment } from '@/hooks/stock-adjustments';
import { type UpdateStockAdjustmentFormData, updateStockAdjustmentSchema } from '@/schemas/stock-adjustments';

interface EditStockAdjustmentDialogProps {
  adjustmentId: string;
  reason: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditStockAdjustmentDialog = ({
  adjustmentId,
  reason,
  onSuccess,
  onCancel,
}: EditStockAdjustmentDialogProps) => {
  const form = useForm<UpdateStockAdjustmentFormData>({
    resolver: zodResolver(updateStockAdjustmentSchema),
    defaultValues: { reason: reason ?? '' },
  });

  const updateMutation = useUpdateStockAdjustment(adjustmentId, { onSuccess: () => onSuccess() });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ reason: data.reason })}
    >
      <TextArea name="reason" label="Reason" placeholder="Enter reason for adjustment" />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save
        </Button>
      </div>
    </Form>
  );
};
