import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateUom } from '@/hooks/uom';
import { type BaseUnitFormData, baseUnitFormResolver } from '@/schemas/uom';

interface AddBaseUnitDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddBaseUnitDialog: React.FC<AddBaseUnitDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<BaseUnitFormData>({
    resolver: baseUnitFormResolver,
    defaultValues: { name: '', symbol: '' },
  });

  const createMutation = useCreateUom({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({ name: data.name, symbol: data.symbol })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Gram" />
      <TextField name="symbol" label="Symbol" placeholder="e.g. g" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Base Unit
        </Button>
      </div>
    </Form>
  );
};
