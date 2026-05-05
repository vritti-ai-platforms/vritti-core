import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { StorageLocationSelector } from '@vritti/quantum-ui/selects/storage-location';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateInventoryItemLocation } from '@/hooks/inventory-items';
import {
  type CreateInventoryItemLocationFormData,
  createInventoryItemLocationSchema,
} from '@/schemas/inventory-item-locations';

interface AddInventoryItemLocationFormProps {
  itemId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddInventoryItemLocationForm: React.FC<AddInventoryItemLocationFormProps> = ({
  itemId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateInventoryItemLocationFormData>({
    resolver: zodResolver(createInventoryItemLocationSchema),
    defaultValues: { locationId: '', reorderLevel: 0 },
  });

  const createMutation = useCreateInventoryItemLocation(itemId, { onSuccess });

  return (
    <Form form={form} mutation={createMutation} onCancel={onCancel}>
      <StorageLocationSelector name="locationId" label="Storage Location" placeholder="Select location" />
      <TextField name="reorderLevel" label="Min. Stock Level" type="number" min={0} step="any" />
      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Location
        </Button>
      </div>
    </Form>
  );
};
