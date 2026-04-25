import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useAddGoodsReceiptItem } from '@/hooks/goods-receipts/useAddGoodsReceiptLine';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';

type AddLineFormData = {
  inventoryItemId: string;
  acceptedQuantity: string;
  rejectedQuantity: string;
};

export const AddLineForm = ({
  id,
  receipt,
  existingInventoryItemIds,
  onSuccess,
  onCancel,
}: {
  id: string;
  receipt: GoodsReceiptData;
  existingInventoryItemIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const mutation = useAddGoodsReceiptItem(id, { onSuccess });

  const [maxAcceptedQuantity, setMaxAcceptedQuantity] = useState<number | null>(null);

  const excludeIds = existingInventoryItemIds.join(',');

  const schema = useMemo(
    () =>
      z
        .object({
          inventoryItemId: z.string().min(1, 'Inventory item is required'),
          acceptedQuantity: z.string().min(1, 'Accepted quantity is required'),
          rejectedQuantity: z.string(),
        })
        .superRefine((data, ctx) => {
          if (maxAcceptedQuantity === null) return;
          const accepted = Number(data.acceptedQuantity);
          const rejected = Number(data.rejectedQuantity);
          if (Number.isFinite(accepted) && accepted > maxAcceptedQuantity) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['acceptedQuantity'],
              message: `Cannot exceed remaining PO quantity (${maxAcceptedQuantity})`,
            });
          }
          if (Number.isFinite(accepted) && Number.isFinite(rejected) && accepted + rejected > maxAcceptedQuantity) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['rejectedQuantity'],
              message: `Accepted + rejected cannot exceed remaining PO quantity (${maxAcceptedQuantity})`,
            });
          }
        }),
    [maxAcceptedQuantity],
  );

  const form = useForm<AddLineFormData>({
    resolver: zodResolver(schema),
    defaultValues: { inventoryItemId: '', acceptedQuantity: '', rejectedQuantity: '0' },
  });

  const watchedAccepted = useWatch({ control: form.control, name: 'acceptedQuantity' });
  const maxRejectedQuantity =
    maxAcceptedQuantity !== null ? Math.max(0, maxAcceptedQuantity - (Number(watchedAccepted) || 0)) : null;

  const handleItemSelect = (option: SelectOption | null) => {
    const ordered = Number(option?.additionals?.orderedQuantity);
    const received = Number(option?.additionals?.receivedQuantity);
    const remaining = Number.isFinite(ordered) && Number.isFinite(received) ? ordered - received : null;
    setMaxAcceptedQuantity(remaining);
    form.setValue('acceptedQuantity', '1');
    form.setValue('rejectedQuantity', '0');
  };

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        inventoryItemId: data.inventoryItemId,
        acceptedQuantity: Number(data.acceptedQuantity),
        rejectedQuantity: Number(data.rejectedQuantity),
      })}
    >
      <InventoryItemSelector
        name="inventoryItemId"
        fieldKeys={{
          valueKey: 'id',
          labelKey: 'name',
          ...(receipt.po ? { additionalKeys: 'orderedQuantity,receivedQuantity' } : {}),
        }}
        params={{
          ...(excludeIds ? { excludeIds } : {}),
          ...(receipt.po ? { poId: receipt.po.id } : { supplierId: receipt.supplierId }),
        }}
        onOptionSelect={handleItemSelect}
      />
      <TextField
        name="acceptedQuantity"
        label="Accepted Quantity"
        type="number"
        positive
        nonZero
        {...(maxAcceptedQuantity !== null ? { max: maxAcceptedQuantity } : {})}
      />
      <TextField
        name="rejectedQuantity"
        label="Rejected Quantity"
        type="number"
        positive
        {...(maxRejectedQuantity !== null ? { max: maxRejectedQuantity } : {})}
      />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Add Line</Button>
      </div>
    </Form>
  );
};
