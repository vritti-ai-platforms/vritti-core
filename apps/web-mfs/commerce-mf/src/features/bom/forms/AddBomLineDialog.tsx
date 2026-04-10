import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateBom } from '@/hooks/useUpdateBom';
import { type BomDetail, type BomLineFormData, bomLineSchema } from '@/schemas/bom';

interface AddBomLineDialogProps {
  bom: BomDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddBomLineDialog: React.FC<AddBomLineDialogProps> = ({ bom, onSuccess, onCancel }) => {
  const form = useForm<BomLineFormData>({
    resolver: zodResolver(bomLineSchema),
    defaultValues: {
      inventoryItemId: '',
      requiredQuantity: '',
    },
  });

  const updateMutation = useUpdateBom({ onSuccess });

  // Existing item IDs to exclude from selector
  const existingItemIds = bom.lines.map((l) => l.inventoryItemId).join(',');

  return (
    <Form
      form={form}
      mutation={updateMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: bom.id,
        data: {
          lines: [
            ...bom.lines.map((l) => ({
              inventoryItemId: l.inventoryItemId,
              requiredQuantity: l.requiredQuantity,
            })),
            {
              inventoryItemId: data.inventoryItemId,
              requiredQuantity: Number(data.requiredQuantity),
            },
          ],
        },
      })}
    >
      <InventoryItemSelector
        name="inventoryItemId"
        label="Inventory Item"
        placeholder="Select material or product"
        params={{ excludeIds: existingItemIds }}
      />
      <TextField name="requiredQuantity" label="Required Quantity" type="number" placeholder="e.g. 300" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Component
        </Button>
      </div>
    </Form>
  );
};
