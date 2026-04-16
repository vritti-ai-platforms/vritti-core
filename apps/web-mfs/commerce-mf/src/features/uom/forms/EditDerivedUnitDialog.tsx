import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateUom } from '@/hooks/uom';
import { type DerivedUnitFormData, derivedUnitFormResolver, type UomData } from '@/schemas/uom';

interface EditDerivedUnitDialogProps {
  unit: UomData;
  baseUnitSymbol: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditDerivedUnitDialog: React.FC<EditDerivedUnitDialogProps> = ({
  unit,
  baseUnitSymbol,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<DerivedUnitFormData>({
    resolver: derivedUnitFormResolver,
    defaultValues: { name: unit.name, symbol: unit.symbol, conversionFactor: unit.conversionFactor },
  });

  const updateMutation = useUpdateUom({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
     
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: unit.id,
        data: { name: data.name, symbol: data.symbol, conversionFactor: data.conversionFactor },
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
