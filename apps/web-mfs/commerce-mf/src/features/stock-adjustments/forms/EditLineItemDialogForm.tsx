import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useUpdateStockAdjustmentLineItem } from '@/hooks/stock-adjustments';

const schema = z.object({
  quantity: z.string().min(1, 'Quantity is required'),
});
type FormData = z.infer<typeof schema>;

interface EditLineItemDialogFormProps {
  adjustmentId: string;
  lineId: string;
  itemId: string;
  defaultQuantity: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditLineItemDialogForm = ({
  adjustmentId,
  lineId,
  itemId,
  defaultQuantity,
  onSuccess,
  onCancel,
}: EditLineItemDialogFormProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: String(defaultQuantity) },
  });
  const mutation = useUpdateStockAdjustmentLineItem(adjustmentId, lineId, itemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      showRootError
      onCancel={onCancel}
      transformSubmit={(data) => ({ quantity: Number(data.quantity) })}
    >
      <TextField name="quantity" label="Quantity" type="number" placeholder="e.g. 10" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Update Line Item</Button>
      </div>
    </Form>
  );
};
