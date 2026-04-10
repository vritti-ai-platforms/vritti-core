import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateUom } from '@/hooks/useUpdateUom';
import { type UomData, type UpdateUomFormData, updateUomSchema } from '@/schemas/uom';

interface EditUomDialogProps {
  uom: UomData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditUomDialog: React.FC<EditUomDialogProps> = ({ uom, onSuccess, onCancel }) => {
  const form = useForm<UpdateUomFormData>({
    resolver: zodResolver(updateUomSchema),
    defaultValues: {
      name: uom.name,
      symbol: uom.symbol,
      baseUnitId: uom.baseUnitId ?? undefined,
      conversionFactor: String(uom.conversionFactor),
    },
  });

  const updateMutation = useUpdateUom({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      showRootError
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: uom.id,
        data: {
          name: data.name,
          symbol: data.symbol,
          baseUnitId: data.baseUnitId || null,
          conversionFactor: data.conversionFactor ? Number(data.conversionFactor) : undefined,
        },
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
