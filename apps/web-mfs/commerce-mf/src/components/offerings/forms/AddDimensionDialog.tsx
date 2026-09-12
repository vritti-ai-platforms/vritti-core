import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type CreateDimensionFormData, createDimensionSchema, toCode } from '@/schemas/offerings';
import type { UseCreateDimension } from '../types';

interface AddDimensionDialogProps {
  useCreate: UseCreateDimension;
  offeringId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddDimensionDialog: React.FC<AddDimensionDialogProps> = ({
  useCreate,
  offeringId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateDimensionFormData>({
    resolver: zodResolver(createDimensionSchema),
    defaultValues: { code: '', name: '', description: '' },
  });

  const name = useWatch({ control: form.control, name: 'name' });

  // The code prefixes a SKU segment, so derive it from the name until it is edited by hand
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
        <TextField name="name" label="Name" placeholder="e.g. Size" />
        <TextField
          name="code"
          label="Code"
          description="Becomes a segment of every SKU on this offering. Fixed once variants exist."
        />
        <TextField name="description" label="Description" placeholder="e.g. Pack sizes offered on this line" />
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Dimension
        </Button>
      </DialogActions>
    </Form>
  );
};
