import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateTaxClass } from '@/hooks/organization/tax-classes';
import { type TaxClassData, type UpdateTaxClassFormData, updateTaxClassSchema } from '@/schemas/tax-classes';

interface EditTaxClassDialogProps {
  taxClass: TaxClassData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditTaxClassDialog: React.FC<EditTaxClassDialogProps> = ({ taxClass, onSuccess, onCancel }) => {
  const form = useForm<UpdateTaxClassFormData>({
    resolver: zodResolver(updateTaxClassSchema),
    defaultValues: {
      name: taxClass.name,
      isActive: taxClass.isActive,
    },
  });

  const updateMutation = useUpdateTaxClass({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: taxClass.id, data: { name: data.name, isActive: data.isActive } })}
    >
      <div className="space-y-4">
        <TextField name="code" label="Code" value={taxClass.code} disabled description="Code cannot be changed" />
        <TextField name="name" label="Name" placeholder="e.g. Standard Rate" />
        <Switch
          name="isActive"
          label="Active"
          description="Inactive tax classes are hidden from product and catalog forms"
        />
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
