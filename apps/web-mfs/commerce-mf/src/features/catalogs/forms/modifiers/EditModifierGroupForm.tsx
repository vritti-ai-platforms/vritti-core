import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateModifierGroup } from '@/hooks/modifiers';
import { type CreateModifierGroupFormData, createModifierGroupSchema } from '@/schemas/modifiers';
import type { ModifierGroupData } from '@/schemas/offerings';

const selectionTypeOptions = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MULTI', label: 'Multi' },
];

interface EditModifierGroupFormProps {
  catalogId: string;
  group: ModifierGroupData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditModifierGroupForm: React.FC<EditModifierGroupFormProps> = ({
  catalogId,
  group,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateModifierGroupFormData>({
    resolver: zodResolver(createModifierGroupSchema),
    defaultValues: {
      name: group.name,
      selectionType: group.selectionType,
      isRequired: group.minSelections > 0,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections ?? undefined,
    },
  });

  const updateMutation = useUpdateModifierGroup({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        catalogId,
        groupId: group.id,
        data: {
          name: data.name,
          selectionType: data.selectionType,
          minSelections: data.isRequired ? Math.max(data.minSelections ?? 0, 1) : 0,
          maxSelections: data.maxSelections ?? null,
        },
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Toppings" />
      <RadioGroup name="selectionType" label="Selection Type" options={selectionTypeOptions} orientation="horizontal" />
      <Switch name="isRequired" label="Required" description="Customers must select from this group when ordering" />
      <TextField name="minSelections" label="Min Selections" type="number" placeholder="0" />
      <TextField name="maxSelections" label="Max Selections" type="number" placeholder="Leave empty for unlimited" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
