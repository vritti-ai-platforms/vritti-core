import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateUom } from '@/hooks/useCreateUom';
import { type CreateUomFormData, createUomSchema } from '@/schemas/uom';

interface AddUomDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddUomDialog: React.FC<AddUomDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateUomFormData>({
    resolver: zodResolver(createUomSchema),
    defaultValues: {
      name: '',
      symbol: '',
      baseUnitId: undefined,
      conversionFactor: '1',
    },
  });

  const createMutation = useCreateUom({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        name: data.name,
        symbol: data.symbol,
        baseUnitId: data.baseUnitId || undefined,
        conversionFactor: data.conversionFactor ? Number(data.conversionFactor) : 1,
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Kilogram" />
      <TextField name="symbol" label="Symbol" placeholder="e.g. kg" />
      <UomSelector name="baseUnitId" label="Base Unit" placeholder="None (this is a base unit)" />
      <TextField name="conversionFactor" label="Conversion Factor" type="number" placeholder="1" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Unit
        </Button>
      </div>
    </Form>
  );
};
