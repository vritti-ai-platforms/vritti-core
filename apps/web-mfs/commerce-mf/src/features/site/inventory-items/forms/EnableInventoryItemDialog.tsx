import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useEnableInventoryItem } from '@/hooks/site/inventory-items';
import { type EnableInventoryItemFormData, enableInventoryItemSchema } from '@/schemas/inventory-items';

interface EnableInventoryItemDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const EnableInventoryItemDialog: React.FC<EnableInventoryItemDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<EnableInventoryItemFormData>({
    resolver: zodResolver(enableInventoryItemSchema),
    defaultValues: {
      inventoryItemId: '',
      reorderPoint: undefined,
      maxStockLevel: undefined,
      safetyStock: undefined,
    },
  });

  const enableMutation = useEnableInventoryItem({ onSuccess });

  return (
    <Form form={form} mutation={enableMutation} resetOnSuccess onCancel={onCancel}>
      <div className="flex flex-col gap-6">
        <FormSection title="Item" contentClassName="block">
          <InventoryItemSelector
            name="inventoryItemId"
            label="Inventory Item"
            placeholder="Select a master item to enable"
            optionsEndpoint="commerce-api/org/inventory-items/select"
          />
        </FormSection>

        <FormSection title="Stock Thresholds" contentClassName="block">
          <div className="grid grid-cols-3 gap-4">
            <TextField name="reorderPoint" label="Reorder Point" type="number" min={0} step="any" />
            <TextField name="maxStockLevel" label="Max Stock Level" type="number" min={0} step="any" />
            <TextField name="safetyStock" label="Safety Stock" type="number" min={0} step="any" />
          </div>
        </FormSection>
      </div>

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
