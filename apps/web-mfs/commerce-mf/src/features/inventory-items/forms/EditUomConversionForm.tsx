import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useUpdateInventoryItemUomConversion } from '@/hooks/inventory-items';
import {
  type UpdateInventoryItemUomConversionFormData,
  updateInventoryItemUomConversionSchema,
} from '@/schemas/inventory-item-uom-conversions';

interface EditUomConversionFormProps {
  itemId: string;
  conversionId: string;
  uomSymbol: string;
  itemUomSymbol: string;
  currentNumerator: number;
  currentDenominator: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditUomConversionForm: React.FC<EditUomConversionFormProps> = ({
  itemId,
  conversionId,
  uomSymbol,
  itemUomSymbol,
  currentNumerator,
  currentDenominator,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateInventoryItemUomConversionFormData>({
    resolver: zodResolver(updateInventoryItemUomConversionSchema),
    defaultValues: { numerator: currentNumerator, denominator: currentDenominator },
  });

  const numerator = useWatch({ control: form.control, name: 'numerator' });
  const denominator = useWatch({ control: form.control, name: 'denominator' });

  const updateMutation = useUpdateInventoryItemUomConversion(itemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ conversionId, numerator: data.numerator, denominator: data.denominator })}
    >
      <p className="text-sm text-muted-foreground">
        Updating the conversion ratio for <span className="font-medium text-foreground">{uomSymbol}</span>.
      </p>
      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-2 gap-3">
          <TextField name="numerator" label={`Count of ${uomSymbol}`} type="number" min={1} step="1" />
          <TextField name="denominator" label={`Count of ${itemUomSymbol}`} type="number" min={1} step="1" />
        </div>
        <p className="text-sm text-muted-foreground">
          {numerator} {uomSymbol} = {denominator} {itemUomSymbol}
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
