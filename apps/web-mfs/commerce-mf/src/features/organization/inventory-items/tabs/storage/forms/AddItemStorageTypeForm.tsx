import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateInventoryItemStorageType } from '@/hooks/organization/inventory-items';
import {
  type AddInventoryItemStorageTypeFormData,
  addInventoryItemStorageTypeSchema,
} from '@/schemas/inventory-item-storage-types';
import { StorageTypeSelector } from '@/selectors/storage-type';
import { UomSelector } from '@/selectors/uom';

interface AddItemStorageTypeFormProps {
  inventoryItemId: string;
  itemUomId: string;
  allowedStorageTypeIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddItemStorageTypeForm: React.FC<AddItemStorageTypeFormProps> = ({
  inventoryItemId,
  itemUomId,
  allowedStorageTypeIds,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddInventoryItemStorageTypeFormData>({
    resolver: zodResolver(addInventoryItemStorageTypeSchema),
    defaultValues: { uomId: itemUomId },
  });

  const createMutation = useCreateInventoryItemStorageType(inventoryItemId, { onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <StorageTypeSelector
        name="storageTypeId"
        params={allowedStorageTypeIds.length > 0 ? { excludeIds: allowedStorageTypeIds.join(',') } : undefined}
        description="Stock of this item may only be put away in locations of the allowed types."
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField name="maxQuantity" label="Max per Location" type="number" positive />
        <UomSelector name="uomId" label="Unit" placeholder="Select unit" params={{ inventoryItemId }} />
      </div>
      <p className="text-sm text-muted-foreground">
        How much of this item fills one location of the type. Smaller amounts use a matching share of its capacity.
      </p>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Storage Type
        </Button>
      </DialogActions>
    </Form>
  );
};
