import { Button } from '@vritti/quantum-ui/Button';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateInventoryItemStorageType } from '@/hooks/organization/inventory-items';
import {
  type InventoryItemStorageTypeData,
  type UpdateInventoryItemStorageTypeFormData,
  updateInventoryItemStorageTypeSchema,
} from '@/schemas/inventory-item-storage-types';
import { UomSelector } from '@/selectors/uom';

interface EditItemStorageTypeFormProps {
  inventoryItemId: string;
  row: InventoryItemStorageTypeData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditItemStorageTypeForm: React.FC<EditItemStorageTypeFormProps> = ({
  inventoryItemId,
  row,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateInventoryItemStorageTypeFormData>({
    resolver: zodResolver(updateInventoryItemStorageTypeSchema),
    defaultValues: { maxQuantity: row.maxQuantity, uomId: row.uomId },
  });

  const updateMutation = useUpdateInventoryItemStorageType(inventoryItemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ rowId: row.id, ...data })}
    >
      <DetailField label="Storage Type" type="string" value={row.storageTypeName} />
      <div className="grid grid-cols-2 gap-3">
        <TextField name="maxQuantity" label="Max per Location" type="number" positive />
        <UomSelector name="uomId" label="Unit" placeholder="Select unit" params={{ inventoryItemId }} />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
