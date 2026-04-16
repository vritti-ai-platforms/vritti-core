import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useUpdateStockAdjustment } from '@/hooks/stock-adjustments';

const schema = z.object({
  quantity: z.string().min(1, 'Quantity is required'),
});

type FormData = z.infer<typeof schema>;

interface EditStockAdjustmentDialogProps {
  adjustmentId: string;
  quantity: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditStockAdjustmentDialog = ({ adjustmentId, quantity, onSuccess, onCancel }: EditStockAdjustmentDialogProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: String(quantity) },
  });

  const updateMutation = useUpdateStockAdjustment(adjustmentId, { onSuccess: () => onSuccess() });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      showRootError
      onCancel={onCancel}
      transformSubmit={(data) => ({ quantity: Number(data.quantity) })}
    >
      <TextField name="quantity" label="Quantity" type="number" />

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
