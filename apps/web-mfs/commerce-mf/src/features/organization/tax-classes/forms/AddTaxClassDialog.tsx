import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateTaxClass } from '@/hooks/organization/tax-classes';
import { type CreateTaxClassFormData, createTaxClassSchema } from '@/schemas/tax-classes';

interface AddTaxClassDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddTaxClassDialog: React.FC<AddTaxClassDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateTaxClassFormData>({
    resolver: zodResolver(createTaxClassSchema),
    defaultValues: {
      code: '',
      name: '',
      isActive: true,
    },
  });

  const createMutation = useCreateTaxClass({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="space-y-4">
        <TextField name="code" label="Code" placeholder="e.g. standard-rate" />
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
        <Button type="submit" loadingText="Creating...">
          Add Tax Class
        </Button>
      </DialogActions>
    </Form>
  );
};
