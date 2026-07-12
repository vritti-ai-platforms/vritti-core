import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useBUCurrency } from '@vritti/quantum-ui/hooks';
import { Select } from '@vritti/quantum-ui/Select';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { type CreateStockAdjustmentFormData, createStockAdjustmentSchema } from '@/schemas/stock-adjustments';
import { useCreateStockAdjustment } from '@/hooks/site/stock-adjustments';

interface CreateStockAdjustmentDialogProps {
  onSuccess: (adjustment: StockAdjustmentData) => void;
  onCancel: () => void;
}

const adjustmentTypeOptions = [
  { value: 'OPENING_STOCK', label: 'Opening Stock' },
  { value: 'WASTE', label: 'Waste' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'THEFT', label: 'Theft' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CORRECTION', label: 'Correction' },
];

export const CreateStockAdjustmentDialog: React.FC<CreateStockAdjustmentDialogProps> = ({ onSuccess, onCancel }) => {
  const buCurrencyCode = useBUCurrency();
  const form = useForm<CreateStockAdjustmentFormData>({
    resolver: zodResolver(createStockAdjustmentSchema),
    defaultValues: {
      inventoryItemId: '',
      type: undefined,
      reason: '',
      unitCost: undefined,
    },
  });

  const isOpeningStock = form.watch('type') === 'OPENING_STOCK';

  const createMutation = useCreateStockAdjustment({
    onSuccess: (data) => onSuccess(data),
  });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        inventoryItemId: data.inventoryItemId,
        type: data.type,
        reason: data.reason,
        unitCost: data.type === 'OPENING_STOCK' ? data.unitCost : undefined,
      })}
    >
      <InventoryItemSelector
        name="inventoryItemId"
        label="Inventory Item"
        placeholder="Select item"
        fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'tracking' }}
        transformDescription={(desc) =>
          desc
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' + ')
        }
      />
      <Select name="type" label="Adjustment Type" placeholder="Select type" options={adjustmentTypeOptions} />
      {isOpeningStock && (
        <CurrencyField
          name="unitCost"
          label="Unit Cost"
          description="Cost per primary unit, in your base currency. Used to value the opening stock."
          currencyCode={buCurrencyCode ?? undefined}
        />
      )}
      <TextArea name="reason" label="Reason" placeholder="Enter reason for adjustment" />

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Draft
        </Button>
      </DialogActions>
    </Form>
  );
};
