import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
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
    defaultValues: { uomId: '', primaryUomQty: 1, uomQty: 1 },
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
