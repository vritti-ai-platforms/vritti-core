import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateBom } from '@/hooks/useUpdateBom';
import { type BomDetail, type UpdateBomFormData, updateBomSchema } from '@/schemas/bom';

interface EditBomFormProps {
  bom: BomDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditBomForm: React.FC<EditBomFormProps> = ({ bom, onSuccess, onCancel }) => {
  const form = useForm<UpdateBomFormData>({
    resolver: zodResolver(updateBomSchema),
    defaultValues: {
      name: bom.name,
      code: bom.code,
      isActive: bom.isActive,
    },
  });

  const updateMutation = useUpdateBom({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      showRootError
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: bom.id,
        data: {
          name: data.name,
          code: data.code,
          isActive: data.isActive,
        },
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Chicken Biryani Full" />
      <TextField name="code" label="Code" placeholder="e.g. BOM-BIR-CHK-F" />
      <Switch name="isActive" label="Active" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
