import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateUom } from '@/hooks/uom';
import { type BaseUnitFormData, baseUnitFormResolver, type UomData } from '@/schemas/uom';

interface EditBaseUnitDialogProps {
  unit: UomData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditBaseUnitDialog: React.FC<EditBaseUnitDialogProps> = ({ unit, onSuccess, onCancel }) => {
  const form = useForm<BaseUnitFormData>({
    resolver: baseUnitFormResolver,
    defaultValues: { name: unit.name, symbol: unit.symbol },
  });

  const updateMutation = useUpdateUom({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
     
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: unit.id, data: { name: data.name, symbol: data.symbol } })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Gram" />
      <TextField name="symbol" label="Symbol" placeholder="e.g. g" />
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
