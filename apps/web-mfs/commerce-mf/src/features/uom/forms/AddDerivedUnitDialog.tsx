import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateUom } from '@/hooks/uom';
import { type DerivedUnitFormData, derivedUnitFormResolver } from '@/schemas/uom';

interface AddDerivedUnitDialogProps {
  baseUnitId: string;
  baseUnitSymbol: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddDerivedUnitDialog: React.FC<AddDerivedUnitDialogProps> = ({
  baseUnitId,
  baseUnitSymbol,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<DerivedUnitFormData>({
    resolver: derivedUnitFormResolver,
    defaultValues: { name: '', symbol: '', conversionFactor: 1 },
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
        baseUnitId,
        conversionFactor: data.conversionFactor,
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Kilogram" />
      <TextField name="symbol" label="Symbol" placeholder="e.g. kg" />
      <TextField
        name="conversionFactor"
        label={`Conversion Factor (relative to ${baseUnitSymbol})`}
        type="number"
        placeholder="e.g. 1000"
      />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Derived Unit
        </Button>
      </div>
    </Form>
  );
};
