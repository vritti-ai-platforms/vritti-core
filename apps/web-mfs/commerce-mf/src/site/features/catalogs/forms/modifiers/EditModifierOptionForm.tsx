import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type CreateModifierOptionFormData, createModifierOptionSchema } from '@/schemas/modifiers';
import type { ModifierOptionData } from '@/schemas/offerings';
import { useUpdateModifierOption } from '@/site/hooks/modifiers';

interface EditModifierOptionFormProps {
  catalogId: string;
  groupId: string;
  option: ModifierOptionData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditModifierOptionForm: React.FC<EditModifierOptionFormProps> = ({
  catalogId,
  groupId,
  option,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateModifierOptionFormData>({
    resolver: zodResolver(createModifierOptionSchema),
    defaultValues: {
      name: option.name,
      additionalPrice: Number(option.additionalPrice),
    },
  });

  const updateMutation = useUpdateModifierOption({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        catalogId,
        groupId,
        optionId: option.id,
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
