import { Button } from '@vritti/quantum-ui/Button';
import { CheckboxGroup } from '@vritti/quantum-ui/CheckboxGroup';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  type CreateDimensionFromTemplateFormData,
  createDimensionFromTemplateSchema,
  type DimensionTemplateValueOption,
} from '@/schemas/offerings';
import { DimensionTemplateSelector } from '@/selectors/dimension-template';
import type { UseCreateDimensionFromTemplate } from '../types';

interface AddDimensionFromTemplateDialogProps {
  useCreate: UseCreateDimensionFromTemplate;
  offeringId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddDimensionFromTemplateDialog: React.FC<AddDimensionFromTemplateDialogProps> = ({
  useCreate,
  offeringId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateDimensionFromTemplateFormData>({
    resolver: zodResolver(createDimensionFromTemplateSchema),
    defaultValues: { templateId: '', code: '', name: '', description: null, valueCodes: [] },
  });
  const [offered, setOffered] = useState<DimensionTemplateValueOption[]>([]);

  const createMutation = useCreate({ onSuccess });
  const valueCodes = form.watch('valueCodes');

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        offeringId,
        templateId: data.templateId,
        code: data.code,
        name: data.name,
        description: data.description,
        values: offered.filter((option) => data.valueCodes.includes(option.code)),
      })}
    >
      <div className="flex flex-col gap-4">
        <DimensionTemplateSelector
          name="templateId"
          onOptionSelect={(option) => {
            const values = (option?.additionals?.values as DimensionTemplateValueOption[] | undefined) ?? [];
            setOffered(values);
            form.setValue('code', (option?.additionals?.code as string) ?? '');
            form.setValue('name', option?.label ?? '');
            form.setValue('description', (option?.additionals?.description as string | null) ?? null);
            // Every value starts ticked: copying the whole template is the common case, narrowing it the exception
            form.setValue(
              'valueCodes',
              values.map((value) => value.code),
              { shouldValidate: true },
            );
          }}
        />

        {offered.length > 0 && (
          <CheckboxGroup
            label="Values to copy"
            description="Variants are generated from the combinations of what you keep."
            columns={2}
            options={offered.map((option) => ({ value: option.code, label: option.value, description: option.code }))}
            value={valueCodes}
            onValueChange={(codes) => form.setValue('valueCodes', codes, { shouldValidate: true })}
            error={form.formState.errors.valueCodes?.message}
          />
        )}
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
