import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUomTable, useUpdateUom } from '@/hooks/uom';
import { type UomData, type UomFormData, uomFormResolver } from '@/schemas/uom';

interface EditUomDialogProps {
  uom: UomData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditUomDialog: React.FC<EditUomDialogProps> = ({ uom, onSuccess, onCancel }) => {
  const isBase = uom.baseUnitId === null;

  const form = useForm<UomFormData>({
    resolver: uomFormResolver,
    defaultValues: {
      name: uom.name,
      symbol: uom.symbol,
      kind: isBase ? 'base' : 'derived',
      baseUnitId: uom.baseUnitId ?? undefined,
      baseUomQty: uom.baseUomQty,
      uomQty: uom.uomQty,
      allowDecimal: uom.allowDecimal,
    },
  });

  const updateMutation = useUpdateUom({ onSuccess });

  const { data: uomsResponse } = useUomTable(uom.dimensionId);
  const baseOptions =
    uomsResponse?.result
      ?.filter((u) => u.baseUnitId === null && u.id !== uom.id)
      .map((u) => ({ value: u.id, label: `${u.name} (${u.symbol})` })) ?? [];

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: uom.id,
        data: {
          name: data.name,
          symbol: data.symbol,
          baseUomQty: isBase ? 1 : (data.baseUomQty ?? 1),
          uomQty: isBase ? 1 : (data.uomQty ?? 1),
          allowDecimal: data.allowDecimal,
        },
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Kilogram" />
      <TextField name="symbol" label="Symbol" placeholder="e.g. kg" />

      {!isBase ? (
        <>
          <Select name="baseUnitId" label="Base unit" placeholder="Select base unit" options={baseOptions} disabled />
          <div className="grid grid-cols-2 gap-3">
            <TextField name="uomQty" label="Count of this unit" type="number" placeholder="e.g. 1" integer positive />
            <TextField
              name="baseUomQty"
              label={`Count of ${uom.baseUnitSymbol ?? 'base units'}`}
              type="number"
              placeholder="e.g. 1000"
              integer
              positive
            />
          </div>
        </>
      ) : null}

      <Switch
        name="allowDecimal"
        label="Allow Decimal"
        description="Turning on will allow the input of fractional quantities"
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
