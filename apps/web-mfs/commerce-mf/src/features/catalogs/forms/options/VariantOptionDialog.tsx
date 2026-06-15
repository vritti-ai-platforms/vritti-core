import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { TokenInput } from '@vritti/quantum-ui/TokenInput';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateVariantOption, useUpdateVariantOption } from '@/hooks/variant-options';
import { type VariantOption, type VariantOptionFormData, variantOptionSchema } from '@/schemas/variant-options';

interface VariantOptionDialogProps {
  catalogId: string;
  option?: VariantOption;
  onSuccess: () => void;
  onCancel: () => void;
}

export const VariantOptionDialog: React.FC<VariantOptionDialogProps> = ({ catalogId, option, onSuccess, onCancel }) => {
  const isEdit = !!option;

  const form = useForm<VariantOptionFormData>({
    resolver: zodResolver(variantOptionSchema),
    defaultValues: {
      name: option?.name ?? '',
      values: option?.values.map((v) => v.value) ?? [],
    },
  });

  const createMutation = useCreateVariantOption({ onSuccess });
  const updateMutation = useUpdateVariantOption({ onSuccess });

  const deletableValues = option?.values.filter((v) => !v.referenced).map((v) => v.value);

  const fields = (
    <>
      <TextField name="name" label="Option name" placeholder="e.g. Size" />
      <TokenInput
        name="values"
        label="Values"
        placeholder="value"
        deletableValues={deletableValues}
        description="Values in use by a variant can't be removed."
      />

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText={isEdit ? 'Saving...' : 'Adding...'}>
          {isEdit ? 'Save option' : 'Add option'}
        </Button>
      </DialogActions>
    </>
  );

  if (isEdit) {
    return (
      <Form
        form={form}
        mutation={updateMutation}
        resetOnSuccess={false}
        onCancel={onCancel}
        transformSubmit={(data) => ({
          catalogId,
          optionId: option.id,
          data: { name: data.name, values: data.values },
        })}
      >
        {fields}
      </Form>
    );
  }

  return (
    <Form
      form={form}
      mutation={createMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ catalogId, data: { name: data.name, values: data.values } })}
    >
      {fields}
    </Form>
  );
};
