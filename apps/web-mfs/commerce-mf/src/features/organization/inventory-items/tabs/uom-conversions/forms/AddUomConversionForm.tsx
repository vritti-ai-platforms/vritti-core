import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateInventoryItemUomConversion } from '@/hooks/organization/inventory-items';
import {
  type CreateInventoryItemUomConversionFormData,
  createInventoryItemUomConversionSchema,
} from '@/schemas/inventory-item-uom-conversions';
import { BASE_MEASURE_SYMBOLS, EMPTY_MEASURE_FIGURES, MeasureValues } from '@/schemas/measures';
import { UomSelector } from '@/selectors/uom';

interface AddUomConversionFormProps {
  inventoryItemId: string;
  itemUomId: string;
  itemUomSymbol: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddUomConversionForm: React.FC<AddUomConversionFormProps> = ({
  inventoryItemId,
  itemUomId,
  itemUomSymbol,
  onSuccess,
  onCancel,
}) => {
  const [selectedUomSymbol, setSelectedUomSymbol] = useState<string | null>(null);

  const form = useForm<CreateInventoryItemUomConversionFormData>({
    resolver: zodResolver(createInventoryItemUomConversionSchema),
    defaultValues: { primaryUomQty: 1, uomQty: 1, ...EMPTY_MEASURE_FIGURES },
  });

  const primaryUomQty = useWatch({ control: form.control, name: 'primaryUomQty' });
  const uomQty = useWatch({ control: form.control, name: 'uomQty' });
  const uomId = useWatch({ control: form.control, name: 'uomId' });

  const createMutation = useCreateInventoryItemUomConversion(inventoryItemId, { onSuccess });

  function handleOptionSelect(option: SelectOption | null) {
    setSelectedUomSymbol((option?.additionals?.symbol as string | undefined) ?? null);
  }

  const showPreview = !!uomId && !!selectedUomSymbol;

  return (
    <Form form={form} mutation={createMutation} onCancel={onCancel}>
      <UomSelector
        name="uomId"
        label="UOM"
        placeholder="Select unit of measure"
        fieldKeys={{ valueKey: 'id', labelKey: 'name', groupIdKey: 'dimensionId', additionalKeys: 'symbol' }}
        params={{ baseOnly: true, excludeIds: itemUomId }}
        onOptionSelect={handleOptionSelect}
      />
      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            name="uomQty"
            label={`Count of ${selectedUomSymbol ?? 'alt UOM'}`}
            type="number"
            integer
            positive
            disabled={!uomId}
          />
          <TextField
            name="primaryUomQty"
            label={`Count of ${itemUomSymbol}`}
            type="number"
            integer
            positive
            disabled={!uomId}
          />
        </div>
        {showPreview && (
          <p className="text-sm text-muted-foreground">
            {uomQty} {selectedUomSymbol} = {primaryUomQty} {itemUomSymbol}
          </p>
        )}
      </div>
      <FormSection
        title={`Per ${selectedUomSymbol ?? 'pack'} (optional)`}
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
            disabled={!uomId}
            endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.WEIGHT]}
          />
          <TextField
            name="volume"
            label="Volume"
            type="number"
            positive
            placeholder="Derived"
            disabled={!uomId}
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
            disabled={!uomId}
            endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.LENGTH]}
          />
          <TextField
            name="width"
            label="Width"
            type="number"
            positive
            placeholder="None"
            disabled={!uomId}
            endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.LENGTH]}
          />
          <TextField
            name="height"
            label="Height"
            type="number"
            positive
            placeholder="None"
            disabled={!uomId}
            endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.LENGTH]}
          />
        </div>
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Conversion
        </Button>
      </DialogActions>
    </Form>
  );
};
