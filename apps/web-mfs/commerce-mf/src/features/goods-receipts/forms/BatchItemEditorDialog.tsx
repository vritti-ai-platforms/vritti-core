import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  useAddGoodsReceiptBatchItem,
  useUpdateGoodsReceiptBatchItem,
} from '@/hooks/goods-receipts/useGoodsReceiptMutations';

const batchItemSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required').max(100),
});

type BatchItemFormData = z.infer<typeof batchItemSchema>;

const BatchItemEditorForm = ({
  id,
  itemId,
  batchId,
  item,
  onSuccess,
  onCancel,
}: {
  id: string;
  itemId: string;
  batchId: string;
  item?: { id: string; serialNumber: string };
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const isEdit = Boolean(item);
  const addMutation = useAddGoodsReceiptBatchItem(id, itemId, batchId, { onSuccess });
  const updateMutation = useUpdateGoodsReceiptBatchItem(id, itemId, batchId, item?.id ?? '', { onSuccess });

  const form = useForm<BatchItemFormData>({
    resolver: zodResolver(batchItemSchema),
    defaultValues: { serialNumber: item?.serialNumber ?? '' },
  });

  return (
    <Form
      form={form}
      mutation={isEdit ? updateMutation : addMutation}
      resetOnSuccess={!isEdit}
      onCancel={onCancel}
      transformSubmit={(data) => ({ serialNumber: data.serialNumber.trim() })}
    >
      <TextField name="serialNumber" label="Serial Number" placeholder="e.g. SN-00001" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">{isEdit ? 'Update Serial' : 'Add Serial'}</Button>
      </div>
    </Form>
  );
};

export const BatchItemEditorDialog = ({
  id,
  itemId,
  batchId,
  handle,
  item,
}: {
  id: string;
  itemId: string;
  batchId: string;
  handle: ReturnType<typeof useDialog>;
  item?: { id: string; serialNumber: string };
}) => (
  <Dialog
    handle={handle}
    title={item ? 'Edit Serial' : 'Add Serial'}
    description={item ? 'Update the serial number for this physical unit.' : 'Register a serial number for this batch.'}
    content={(close) => (
      <BatchItemEditorForm
        id={id}
        itemId={itemId}
        batchId={batchId}
        item={item}
        onSuccess={close}
        onCancel={close}
      />
    )}
  />
);
