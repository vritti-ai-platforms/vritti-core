import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type OfferingAttributeData, type UpdateAttributeFormData, updateAttributeSchema } from '@/schemas/offerings';
import type { UseUpdateAttribute } from '../types';

interface EditAttributeDialogProps {
  useUpdate: UseUpdateAttribute;
  attribute: OfferingAttributeData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditAttributeDialog: React.FC<EditAttributeDialogProps> = ({
  useUpdate,
  attribute,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateAttributeFormData>({
    resolver: zodResolver(updateAttributeSchema),
    defaultValues: { name: attribute.name, description: attribute.description ?? '' },
  });

  const updateMutation = useUpdate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: attribute.id, name: data.name, description: data.description })}
    >
      <div className="flex flex-col gap-4">
        <TextField
          name="name"
          label="Name"
          description={`The code stays "${attribute.code}" — a storefront filters on it.`}
        />
        <TextField name="description" label="Description" placeholder="e.g. Nutritional claims this product carries" />
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
