import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateInventoryItemMrp } from '@/hooks/organization/inventory-items';
import {
  type InventoryItemMrpData,
  type UpdateInventoryItemMrpFormData,
  updateInventoryItemMrpSchema,
} from '@/schemas/inventory-item-mrp';

interface EditMrpFormProps {
  inventoryItemId: string;
  row: InventoryItemMrpData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditMrpForm: React.FC<EditMrpFormProps> = ({ inventoryItemId, row, onSuccess, onCancel }) => {
  const form = useForm<UpdateInventoryItemMrpFormData>({
    resolver: zodResolver(updateInventoryItemMrpSchema),
    defaultValues: {
      amount: row.amount,
    },
  });

  const updateMutation = useUpdateInventoryItemMrp(inventoryItemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ mrpId: row.id, data })}
    >
      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Unit" type="string" value={row.uomSymbol ?? '—'} />
        <DetailField label="Currency" type="string" value={row.amount.currency} mono />
      </div>
      <CurrencyField name="amount" label="MRP Amount" currencyCode={row.amount.currency} />
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
