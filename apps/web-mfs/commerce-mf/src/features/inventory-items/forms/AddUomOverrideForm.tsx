import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import type React from 'react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateInventoryItemUomConversion } from '@/hooks/inventory-items';
import {
  type CreateInventoryItemUomConversionFormData,
  createInventoryItemUomConversionSchema,
} from '@/schemas/inventory-item-uom-conversions';

interface AddUomOverrideFormProps {
  itemId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddUomOverrideForm: React.FC<AddUomOverrideFormProps> = ({ itemId, onSuccess, onCancel }) => {
  const [selectedUomSymbol, setSelectedUomSymbol] = useState<string | null>(null);
  const [selectedBaseSymbol, setSelectedBaseSymbol] = useState<string | null>(null);

  const form = useForm<CreateInventoryItemUomConversionFormData>({
    resolver: zodResolver(createInventoryItemUomConversionSchema),
    defaultValues: { uomId: '', conversionFactor: 1 },
  });

  const conversionFactor = useWatch({ control: form.control, name: 'conversionFactor' });
  const uomId = useWatch({ control: form.control, name: 'uomId' });

  const createMutation = useCreateInventoryItemUomConversion(itemId, { onSuccess });

  function handleOptionSelect(option: SelectOption | null) {
    setSelectedUomSymbol((option?.additionals?.symbol as string | undefined) ?? null);
    setSelectedBaseSymbol((option?.additionals?.baseUomSymbol as string | undefined) ?? null);
  }

  const showPreview = !!uomId && !!selectedUomSymbol;

  return (
    <Form form={form} mutation={createMutation} onCancel={onCancel}>
      <UomSelector
        name="uomId"
        label="UOM"
        placeholder="Select unit of measure"
        params={{ derivedOnly: true }}
        onOptionSelect={handleOptionSelect}
      />
      <div className="flex flex-col gap-1">
        <TextField
          name="conversionFactor"
          label="Override Factor"
          type="number"
          min={0.0000001}
          step="any"
        />
        {showPreview && (
          <p className="text-sm text-muted-foreground">
            1 {selectedUomSymbol} = {conversionFactor} {selectedBaseSymbol ?? ''}
          </p>
        )}
      </div>
      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Override
        </Button>
      </div>
    </Form>
  );
};
