import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  type UpdateInventoryItemUomConversionFormData,
  updateInventoryItemUomConversionSchema,
} from '@/schemas/inventory-item-uom-conversions';
import { useUpdateInventoryItemUomConversion } from '@/site/hooks/inventory-items';

interface EditUomConversionFormProps {
  inventoryItemId: string;
  conversionId: string;
  uomSymbol: string;
  itemUomSymbol: string;
  currentPrimaryUomQty: number;
  currentUomQty: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditUomConversionForm: React.FC<EditUomConversionFormProps> = ({
  inventoryItemId,
  conversionId,
  uomSymbol,
  itemUomSymbol,
  currentPrimaryUomQty,
  currentUomQty,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateInventoryItemUomConversionFormData>({
    resolver: zodResolver(updateInventoryItemUomConversionSchema),
    defaultValues: { primaryUomQty: currentPrimaryUomQty, uomQty: currentUomQty },
  });

  const primaryUomQty = useWatch({ control: form.control, name: 'primaryUomQty' });
  const uomQty = useWatch({ control: form.control, name: 'uomQty' });

  const updateMutation = useUpdateInventoryItemUomConversion(inventoryItemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ conversionId, primaryUomQty: data.primaryUomQty, uomQty: data.uomQty })}
    >
      <p className="text-sm text-muted-foreground">
        Updating the conversion ratio for <span className="font-medium text-foreground">{uomSymbol}</span>.
      </p>
      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-2 gap-3">
          <TextField name="uomQty" label={`Count of ${uomSymbol}`} type="number" integer positive />
          <TextField name="primaryUomQty" label={`Count of ${itemUomSymbol}`} type="number" integer positive />
        </div>
        <p className="text-sm text-muted-foreground">
          {uomQty} {uomSymbol} = {primaryUomQty} {itemUomSymbol}
        </p>
      </div>
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
