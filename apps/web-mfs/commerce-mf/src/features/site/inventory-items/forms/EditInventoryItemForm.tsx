import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useBUCurrency } from '@vritti/quantum-ui/hooks';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { TaxGroupSelector } from '@vritti/quantum-ui/selects/tax-group';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  type InventoryItemData,
  inventoryItemTypeOptions,
  type UpdateInventoryItemFormData,
  updateInventoryItemSchema,
} from '@/schemas/inventory-items';
import { useUpdateInventoryItem } from '@/hooks/site/inventory-items';

interface EditInventoryItemFormProps {
  item: InventoryItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

const pickStrategyOptions = [
  { value: 'none', label: 'None — free pick' },
  { value: 'fifo', label: 'FIFO — oldest received first' },
  { value: 'fefo', label: 'FEFO — nearest expiry first' },
];

export const EditInventoryItemForm: React.FC<EditInventoryItemFormProps> = ({ item, onSuccess, onCancel }) => {
  const form = useForm<UpdateInventoryItemFormData>({
    resolver: zodResolver(updateInventoryItemSchema),
    defaultValues: {
      name: item.name,
      code: item.code,
      type: item.type,
      pickStrategy: item.pickStrategy,
      categoryId: item.categoryId,
      description: item.description ?? '',
      uomId: item.uomId,
      purchaseTaxGroupId: item.purchaseTaxGroupId ?? undefined,
      hsnCode: item.hsnCode ?? '',
      hasMrp: item.hasMrp,
      mrpUomId: item.mrpUomId ?? undefined,
      defaultMrp: item.defaultMrp ?? undefined,
    },
  });

  const updateMutation = useUpdateInventoryItem({ onSuccess });
  const hasMrp = useWatch({ control: form.control, name: 'hasMrp' });
  const buCurrencyCode = useBUCurrency();

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: item.id,
        data: {
          ...data,
          mrpUomId: data.hasMrp ? data.mrpUomId : undefined,
          defaultMrp: data.hasMrp ? data.defaultMrp : undefined,
        },
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Basic Info">
          <div className="grid grid-cols-3 gap-4">
            <TextField name="name" label="Name" placeholder="e.g. Basmati Rice" />
            <TextField name="code" label="Code" placeholder="e.g. RAW-RICE-BAS" />
            <Select name="type" label="Type" placeholder="Select type" options={inventoryItemTypeOptions} />
            <UomSelector name="uomId" label="Unit of Measure" placeholder="Select unit" />
            <div className="col-span-2">
              <CategorySelector name="categoryId" />
            </div>
          </div>
        </FormSection>

        {item.tracking !== 'quantity' && (
          <FormSection title="Tracking">
            <RadioGroup name="pickStrategy" label="Pick Strategy" options={pickStrategyOptions} />
          </FormSection>
        )}

        <FormSection title="Tax & Compliance">
          <div className="grid grid-cols-2 gap-4">
            <TaxGroupSelector name="purchaseTaxGroupId" label="Purchase Tax Group" placeholder="Select tax group" />
            <TextField name="hsnCode" label="HSN Code" placeholder="e.g. 1006" />
            <div className="col-span-2">
              <Switch
                name="hasMrp"
                label="Tracks MRP"
                description="Enable to capture a printed MRP on this item and its stock."
              />
            </div>
            {hasMrp && (
              <>
                <UomSelector
                  name="mrpUomId"
                  label="MRP Unit"
                  placeholder="Select unit"
                  params={{ inventoryItemId: item.id }}
                />
                <CurrencyField name="defaultMrp" label="Default MRP" currencyCode={buCurrencyCode ?? undefined} />
              </>
            )}
          </div>
        </FormSection>

        <FormSection title="Notes">
          <TextArea name="description" label="Description" placeholder="Optional description" />
        </FormSection>
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
