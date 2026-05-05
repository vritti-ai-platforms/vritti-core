import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useUpdateInventoryItemUomConversion } from '@/hooks/inventory-items';
import {
  type UpdateInventoryItemUomConversionFormData,
  updateInventoryItemUomConversionSchema,
} from '@/schemas/inventory-item-uom-conversions';

interface EditUomOverrideFormProps {
  itemId: string;
  conversionId: string;
  uomSymbol: string;
  baseUomSymbol: string | null;
  currentFactor: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditUomOverrideForm: React.FC<EditUomOverrideFormProps> = ({
  itemId,
  conversionId,
  uomSymbol,
  baseUomSymbol,
  currentFactor,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateInventoryItemUomConversionFormData>({
    resolver: zodResolver(updateInventoryItemUomConversionSchema),
    defaultValues: { conversionFactor: currentFactor },
  });

  const conversionFactor = useWatch({ control: form.control, name: 'conversionFactor' });

  const updateMutation = useUpdateInventoryItemUomConversion(itemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ conversionId, conversionFactor: data.conversionFactor })}
    >
      <p className="text-sm text-muted-foreground">
        Overriding the conversion factor for <span className="font-medium text-foreground">{uomSymbol}</span>.
      </p>
      <div className="flex flex-col gap-1">
        <TextField
          name="conversionFactor"
          label="Override Factor"
          type="number"
          min={0.0000001}
          step="any"
        />
        <p className="text-sm text-muted-foreground">
          1 {uomSymbol} = {conversionFactor} {baseUomSymbol ?? ''}
        </p>
      </div>
      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
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
