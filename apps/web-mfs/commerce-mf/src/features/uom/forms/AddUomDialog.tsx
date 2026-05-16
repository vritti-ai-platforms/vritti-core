import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { Select } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateUom, useUomTable } from '@/hooks/uom';
import { type UomFormData, uomFormResolver } from '@/schemas/uom';

interface AddUomDialogProps {
  dimensionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const kindOptions = [
  { value: 'base', label: 'Base unit' },
  { value: 'derived', label: 'Derived unit' },
];

export const AddUomDialog: React.FC<AddUomDialogProps> = ({ dimensionId, onSuccess, onCancel }) => {
  const form = useForm<UomFormData>({
    resolver: uomFormResolver,
    defaultValues: { name: '', symbol: '', kind: 'base', baseUnitId: undefined, conversionFactor: 1 },
  });

  const kind = useWatch({ control: form.control, name: 'kind' });
  const createMutation = useCreateUom({ onSuccess });

  const { data: uomsResponse } = useUomTable(dimensionId);
  const baseOptions =
    uomsResponse?.result
      ?.filter((u) => u.baseUnitId === null)
      .map((u) => ({ value: u.id, label: `${u.name} (${u.symbol})` })) ?? [];

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        name: data.name,
        symbol: data.symbol,
        dimensionId,
        baseUnitId: data.kind === 'base' ? null : data.baseUnitId,
        conversionFactor: data.kind === 'base' ? 1 : (data.conversionFactor ?? 1),
      })}
    >
      <RadioGroup name="kind" label="Kind" options={kindOptions} orientation="horizontal" />
      <TextField name="name" label="Name" placeholder="e.g. Kilogram" />
      <TextField name="symbol" label="Symbol" placeholder="e.g. kg" />

      {kind === 'derived' ? (
        <>
          <Select name="baseUnitId" label="Base unit" placeholder="Select base unit" options={baseOptions} />
          <TextField name="conversionFactor" label="Conversion factor" type="number" placeholder="e.g. 1000" positive />
        </>
      ) : null}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add UOM
        </Button>
      </div>
    </Form>
  );
};
