import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAddStockAdjustmentLineItem } from '@/hooks/stock-adjustments';

const schema = z.object({
  quantity: z.string().min(1, 'Quantity is required'),
});
type FormData = z.infer<typeof schema>;

interface AddLineItemDialogFormProps {
  adjustmentId: string;
  lineId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddLineItemDialogForm = ({ adjustmentId, lineId, onSuccess, onCancel }: AddLineItemDialogFormProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: '' },
  });
  const mutation = useAddStockAdjustmentLineItem(adjustmentId, lineId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
     
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({ quantity: Number(data.quantity) })}
    >
      <TextField name="quantity" label="Quantity" type="number" placeholder="e.g. 10" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Add Line Item</Button>
      </div>
    </Form>
  );
};
