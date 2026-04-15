import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { StorageLocationSelector } from '@vritti/quantum-ui/selects/storage-location';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useUpdateStockAdjustmentLine } from '@/hooks/stock-adjustments';
import type { StockAdjustmentLineData } from '@/schemas/stock-adjustments';

const schema = z.object({
  quantity: z.string().min(1, 'Quantity is required'),
  locationId: z.string().optional(),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function formatLocationPathLabel(path: string): string {
  return path
    .split('.')
    .map((segment) =>
      segment
        .split('_')
        .filter(Boolean)
        .map((part) => part.toUpperCase())
        .join(' '),
    )
    .join(' / ');
}

interface EditStockAdjustmentLineDialogFormProps {
  adjustmentId: string;
  line: StockAdjustmentLineData;
  isOpeningStock: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditStockAdjustmentLineDialogForm = ({
  adjustmentId,
  line,
  isOpeningStock,
  onSuccess,
  onCancel,
}: EditStockAdjustmentLineDialogFormProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: String(line.quantity),
      locationId: line.locationId,
      manufacturingDate: line.manufacturingDate,
      expiryDate: line.expiryDate,
    },
  });

  useEffect(() => {
    form.reset({
      quantity: String(line.quantity),
      locationId: line.locationId || undefined,
      manufacturingDate: line.manufacturingDate || '',
      expiryDate: line.expiryDate || '',
    });
  }, [line, form]);

  const mutation = useUpdateStockAdjustmentLine(adjustmentId, line.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      showRootError
      onCancel={onCancel}
      transformSubmit={(data) => ({
        quantity: Number(data.quantity),
        ...(isOpeningStock
          ? {
              locationId: data.locationId || undefined,
              manufacturingDate: data.manufacturingDate || undefined,
              expiryDate: data.expiryDate || undefined,
            }
          : {}),
      })}
    >
      {isOpeningStock ? (
        <>
          <StorageLocationSelector
            name="locationId"
            label="Storage Location"
            placeholder="Select location"
            fieldKeys={{ valueKey: 'id', labelKey: 'path' }}
            transformLabel={(label) => formatLocationPathLabel(label)}
          />
          <TextField name="quantity" label="Quantity" type="number" />
          <TextField name="manufacturingDate" label="Manufacturing Date" type="date" />
          <TextField name="expiryDate" label="Expiry Date" type="date" />
        </>
      ) : (
        <TextField name="quantity" label="Quantity" type="number" />
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Update Line</Button>
      </div>
    </Form>
  );
};
