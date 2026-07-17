import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useBUCurrency } from '@vritti/quantum-ui/hooks';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddInventoryItemMrp } from '@/hooks/organization/inventory-items';
import { type AddInventoryItemMrpFormData, addInventoryItemMrpSchema } from '@/schemas/inventory-item-mrp';

interface AddMrpFormProps {
  inventoryItemId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddMrpForm: React.FC<AddMrpFormProps> = ({ inventoryItemId, onSuccess, onCancel }) => {
  const buCurrencyCode = useBUCurrency();

  const form = useForm<AddInventoryItemMrpFormData>({
    resolver: zodResolver(addInventoryItemMrpSchema),
    defaultValues: {
      uomId: '',
      amount: undefined,
    },
  });

  const addMutation = useAddInventoryItemMrp(inventoryItemId, { onSuccess });

  return (
    <Form form={form} mutation={addMutation} onCancel={onCancel}>
      <UomSelector name="uomId" label="Unit" placeholder="Select unit" params={{ inventoryItemId }} />
      <CurrencyField name="amount" label="MRP Amount" currencyCode={buCurrencyCode ?? undefined} />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add MRP
        </Button>
      </DialogActions>
    </Form>
  );
};
