import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type CreateDimensionFromTemplateFormData, createDimensionFromTemplateSchema } from '@/schemas/offerings';
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
    defaultValues: { templateId: '' },
  });

  const createMutation = useCreate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({ offeringId, templateId: data.templateId })}
    >
      <div className="flex flex-col gap-4">
        <DimensionTemplateSelector
          name="templateId"
          description="Its code, name and values are copied onto this offering. Editing the template later will not reshape it."
        />
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
