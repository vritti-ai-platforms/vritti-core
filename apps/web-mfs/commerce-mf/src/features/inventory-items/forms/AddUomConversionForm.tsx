import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateInventoryItemUomConversion } from '@/hooks/inventory-items';
import {
  type CreateInventoryItemUomConversionFormData,
  createInventoryItemUomConversionSchema,
} from '@/schemas/inventory-item-uom-conversions';

interface AddUomConversionFormProps {
  itemId: string;
  itemUomId: string;
  itemUomSymbol: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddUomConversionForm: React.FC<AddUomConversionFormProps> = ({
  itemId,
  itemUomId,
  itemUomSymbol,
  onSuccess,
  onCancel,
}) => {
  const [selectedUomSymbol, setSelectedUomSymbol] = useState<string | null>(null);

  const form = useForm<CreateInventoryItemUomConversionFormData>({
    resolver: zodResolver(createInventoryItemUomConversionSchema),
    defaultValues: { uomId: '', numerator: 1, denominator: 1 },
  });

  const numerator = useWatch({ control: form.control, name: 'numerator' });
  const denominator = useWatch({ control: form.control, name: 'denominator' });
  const uomId = useWatch({ control: form.control, name: 'uomId' });

  const createMutation = useCreateInventoryItemUomConversion(itemId, { onSuccess });

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
            name="numerator"
            label={`Count of ${selectedUomSymbol ?? 'alt UOM'}`}
            type="number"
            min={1}
            step="1"
            disabled={!uomId}
          />
          <TextField
            name="denominator"
            label={`Count of ${itemUomSymbol}`}
            type="number"
            min={1}
            step="1"
            disabled={!uomId}
          />
        </div>
        {showPreview && (
          <p className="text-sm text-muted-foreground">
            {numerator} {selectedUomSymbol} = {denominator} {itemUomSymbol}
          </p>
        )}
      </div>
      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Conversion
        </Button>
      </div>
    </Form>
  );
};
