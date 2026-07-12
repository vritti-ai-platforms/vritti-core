import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type CreateModifierOptionFormData, createModifierOptionSchema } from '@/schemas/modifiers';
import { useCreateModifierOption } from '@/hooks/site/modifiers';

interface AddModifierOptionFormProps {
  catalogId: string;
  groupId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddModifierOptionForm: React.FC<AddModifierOptionFormProps> = ({
  catalogId,
  groupId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateModifierOptionFormData>({
    resolver: zodResolver(createModifierOptionSchema),
    defaultValues: {
      name: '',
      additionalPrice: 0,
    },
  });

  const createMutation = useCreateModifierOption({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        catalogId,
        groupId,
        data: {
          name: data.name,
          additionalPrice: data.additionalPrice,
        },
      })}
    >
      <TextField name="name" label="Option Name" placeholder="e.g. Extra Cheese" />
      <TextField name="additionalPrice" label="Additional Price" type="number" placeholder="0.00" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Option
        </Button>
      </DialogActions>
    </Form>
  );
};
