import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useUpdateGoodsReceiptItem } from '@/hooks/goods-receipts/useUpdateGoodsReceiptLine';
import type { GoodsReceiptItemData } from '@/schemas/goods-receipts';

type EditLineFormData = {
  inventoryItemId: string;
  acceptedQuantity: string;
  rejectedQuantity: string;
};

export const EditLineForm = ({
  receiptId,
  item,
  onSuccess,
  onCancel,
}: {
  receiptId: string;
  item: GoodsReceiptItemData;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const mutation = useUpdateGoodsReceiptItem(receiptId, item.id, { onSuccess });

  // receivedQuantity only includes published GRs, so remaining = ordered - received
  const maxAcceptedQuantity = item.poItem ? item.poItem.orderedQuantity - item.poItem.receivedQuantity : null;

  const schema = useMemo(
    () =>
      z
        .object({
          inventoryItemId: z.string(),
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

  const form = useForm<EditLineFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      inventoryItemId: item.inventoryItemId,
      acceptedQuantity: String(item.acceptedQuantity),
      rejectedQuantity: String(item.rejectedQuantity),
    },
  });

  const watchedAccepted = useWatch({ control: form.control, name: 'acceptedQuantity' });
  const maxRejectedQuantity =
    maxAcceptedQuantity !== null ? Math.max(0, maxAcceptedQuantity - (Number(watchedAccepted) || 0)) : null;

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={({ acceptedQuantity, rejectedQuantity }) => ({
        acceptedQuantity: Number(acceptedQuantity),
        rejectedQuantity: Number(rejectedQuantity),
      })}
    >
      <InventoryItemSelector
        name="inventoryItemId"
        disabled
        value={item.inventoryItemId}
        fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
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
        <Button type="submit">Save Changes</Button>
      </div>
    </Form>
  );
};
