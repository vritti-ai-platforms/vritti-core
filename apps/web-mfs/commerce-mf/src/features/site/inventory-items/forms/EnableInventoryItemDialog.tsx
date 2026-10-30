import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useEnableInventoryItem } from '@/hooks/site/inventory-items';
import {
  type EnableInventoryItemFormData,
  enableInventoryItemSchema,
  type InventoryItemData,
} from '@/schemas/inventory-items';

interface EnableInventoryItemDialogProps {
  item: InventoryItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EnableInventoryItemDialog: React.FC<EnableInventoryItemDialogProps> = ({ item, onSuccess, onCancel }) => {
  const form = useForm<EnableInventoryItemFormData>({
    resolver: zodResolver(enableInventoryItemSchema),
    defaultValues: { inventoryItemId: item.id },
  });

  const enableMutation = useEnableInventoryItem({ onSuccess });

  return (
    <Form form={form} mutation={enableMutation} onCancel={onCancel}>
      <FormSection title="Stock Thresholds" contentClassName="block">
        <div className="grid grid-cols-3 gap-4">
          <TextField name="reorderPoint" label="Reorder Point" type="number" min={0} step="any" />
          <TextField name="maxStockLevel" label="Max Stock Level" type="number" min={0} step="any" />
          <TextField name="safetyStock" label="Safety Stock" type="number" min={0} step="any" />
        </div>
      </FormSection>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Enabling...">
          Enable at Site
        </Button>
      </DialogActions>
    </Form>
  );
};
