import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useBUCurrency } from '@vritti/quantum-ui/hooks';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpsertInventoryItemMrp } from '@/hooks/organization/inventory-items';
import { type UpsertInventoryItemMrpFormData, upsertInventoryItemMrpSchema } from '@/schemas/inventory-item-mrp';

interface UpsertMrpFormProps {
  inventoryItemId: string;
  currentUomId?: string | null;
  currentAmount?: { currency: string; value: string } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const UpsertMrpForm: React.FC<UpsertMrpFormProps> = ({
  inventoryItemId,
  currentUomId,
  currentAmount,
  onSuccess,
  onCancel,
}) => {
  const buCurrencyCode = useBUCurrency();

  const form = useForm<UpsertInventoryItemMrpFormData>({
    resolver: zodResolver(upsertInventoryItemMrpSchema),
    defaultValues: {
      uomId: currentUomId ?? '',
      amount: currentAmount ?? undefined,
      sourceLotId: null,
    },
  });

  const upsertMutation = useUpsertInventoryItemMrp(inventoryItemId, { onSuccess });

  return (
    <Form form={form} mutation={upsertMutation} onCancel={onCancel}>
      <UomSelector name="uomId" label="Unit" placeholder="Select unit" params={{ inventoryItemId }} />
      <CurrencyField
        name="amount"
        label="MRP Amount"
        currencyCode={currentAmount?.currency ?? buCurrencyCode ?? undefined}
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save MRP
        </Button>
      </DialogActions>
    </Form>
  );
};
