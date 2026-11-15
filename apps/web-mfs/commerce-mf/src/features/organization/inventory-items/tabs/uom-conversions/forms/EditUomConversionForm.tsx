import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useUpdateInventoryItemUomConversion } from '@/hooks/organization/inventory-items';
import {
  type InventoryItemUomConversionData,
  type UpdateInventoryItemUomConversionFormData,
  updateInventoryItemUomConversionSchema,
} from '@/schemas/inventory-item-uom-conversions';
import { BASE_MEASURE_SYMBOLS, MeasureValues, pickMeasureFigures } from '@/schemas/measures';

interface EditUomConversionFormProps {
  inventoryItemId: string;
  conversion: InventoryItemUomConversionData;
  itemUomSymbol: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditUomConversionForm: React.FC<EditUomConversionFormProps> = ({
  inventoryItemId,
  conversion,
  itemUomSymbol,
  onSuccess,
  onCancel,
}) => {
  const uomSymbol = conversion.uomSymbol;
  const form = useForm<UpdateInventoryItemUomConversionFormData>({
    resolver: zodResolver(updateInventoryItemUomConversionSchema),
    defaultValues: {
      primaryUomQty: conversion.primaryUomQty,
      uomQty: conversion.uomQty,
      ...pickMeasureFigures(conversion),
    },
  });

  const primaryUomQty = useWatch({ control: form.control, name: 'primaryUomQty' });
  const uomQty = useWatch({ control: form.control, name: 'uomQty' });

  const updateMutation = useUpdateInventoryItemUomConversion(inventoryItemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ conversionId: conversion.id, ...data })}
    >
      <FormSection title="Conversion" contentClassName="block">
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-2 gap-3">
            <TextField name="uomQty" label={`Count of ${uomSymbol}`} type="number" integer positive />
            <TextField name="primaryUomQty" label={`Count of ${itemUomSymbol}`} type="number" integer positive />
          </div>
          <p className="text-sm text-muted-foreground">
            {uomQty} {uomSymbol} = {primaryUomQty} {itemUomSymbol}
          </p>
        </div>
      </FormSection>

      <FormSection
        title={`Per ${uomSymbol} (optional)`}
        description={`Blank weight and volume are worked out from the ${itemUomSymbol} figures; blank dimensions skip the fit check.`}
        contentClassName="block"
      >
        <div className="grid grid-cols-2 gap-3">
          <TextField
            name="weight"
            label="Weight"
            type="number"
            positive
            placeholder="Derived"
            endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.WEIGHT]}
          />
          <TextField
            name="volume"
            label="Volume"
            type="number"
            positive
            placeholder="Derived"
            endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.VOLUME]}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <TextField
            name="length"
            label="Length"
            type="number"
            positive
            placeholder="None"
            endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.LENGTH]}
          />
          <TextField
            name="width"
            label="Width"
            type="number"
            positive
            placeholder="None"
            endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.LENGTH]}
          />
          <TextField
            name="height"
            label="Height"
            type="number"
            positive
            placeholder="None"
            endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.LENGTH]}
          />
        </div>
      </FormSection>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
