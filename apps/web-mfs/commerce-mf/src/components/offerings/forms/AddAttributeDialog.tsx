import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type CreateAttributeFormData, createAttributeSchema, toCode } from '@/schemas/offerings';
import type { UseCreateAttribute } from '../types';

interface AddAttributeDialogProps {
  useCreate: UseCreateAttribute;
  offeringId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddAttributeDialog: React.FC<AddAttributeDialogProps> = ({
  useCreate,
  offeringId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateAttributeFormData>({
    resolver: zodResolver(createAttributeSchema),
    defaultValues: { code: '', name: '', description: '' },
  });

  const name = useWatch({ control: form.control, name: 'name' });

  // The code is what a storefront filters by, so derive it from the name until it is edited by hand
  useEffect(() => {
    if (!form.formState.dirtyFields.code) form.setValue('code', toCode(name ?? ''));
  }, [name, form]);

  const createMutation = useCreate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({ offeringId, code: data.code, name: data.name, description: data.description })}
    >
      <div className="flex flex-col gap-4">
        <TextField name="name" label="Name" placeholder="e.g. Dietary" />
        <TextField
          name="code"
          label="Code"
          description="What a storefront filters by. Fixed once the attribute exists."
        />
        <TextField name="description" label="Description" placeholder="e.g. Nutritional claims this product carries" />
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Attribute
        </Button>
      </DialogActions>
    </Form>
  );
};
