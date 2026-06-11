import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { Select } from '@vritti/quantum-ui/Select';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { TaxGroupSelector } from '@vritti/quantum-ui/selects/tax-group';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateInventoryItem } from '@/hooks/inventory-items';
import {
  type CreateInventoryItemFormData,
  createInventoryItemSchema,
  inventoryItemTypeOptions,
} from '@/schemas/inventory-items';

interface AddInventoryItemDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const trackingOptions = [
  { value: 'quantity', label: 'Quantity — bulk fungible (e.g. office supplies)' },
  { value: 'lot', label: 'Lot — batch identity (mfg/expiry, lot #)' },
  { value: 'serial', label: 'Serial — per unit, no batch (e.g. IT assets, tools)' },
  { value: 'lot_serial', label: 'Lot + Serial — per unit within batch (e.g. pharma)' },
];

const pickStrategyOptions = [
  { value: 'none', label: 'None — free pick' },
  { value: 'fifo', label: 'FIFO — oldest received first' },
  { value: 'fefo', label: 'FEFO — nearest expiry first' },
];

export const AddInventoryItemDialog: React.FC<AddInventoryItemDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateInventoryItemFormData>({
    resolver: zodResolver(createInventoryItemSchema),
    defaultValues: {
      name: '',
      code: '',
      type: 'RAW_MATERIAL',
      tracking: 'lot',
      pickStrategy: 'none',
      categoryId: '',
      description: '',
      uomId: '',
      purchaseTaxGroupId: undefined,
      hsnCode: '',
    },
  });

  const tracking = useWatch({ control: form.control, name: 'tracking' });
  const createMutation = useCreateInventoryItem({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="flex flex-col gap-6">
        <FormSection title="Basic Info">
          <div className="grid grid-cols-2 gap-4">
            <TextField name="name" label="Name" placeholder="e.g. Basmati Rice" />
            <TextField name="code" label="Code" placeholder="e.g. RAW-RICE-BAS" />
            <Select name="type" label="Type" placeholder="Select type" options={inventoryItemTypeOptions} />
            <UomSelector name="uomId" label="Unit of Measure" placeholder="Select unit" />
            <div className="col-span-2">
              <CategorySelector name="categoryId" />
            </div>
          </div>
        </FormSection>

        <FormSection title="Tracking" description="How stock is identified and picked from inventory.">
          <div className="grid grid-cols-2 gap-6">
            <RadioGroup name="tracking" label="Tracking Method" options={trackingOptions} />
            {tracking !== 'quantity' && (
              <RadioGroup name="pickStrategy" label="Pick Strategy" options={pickStrategyOptions} />
            )}
          </div>
        </FormSection>

        <FormSection title="Tax & Compliance" description="Purchase tax and HSN classification for this item.">
          <div className="grid grid-cols-2 gap-4">
            <TaxGroupSelector name="purchaseTaxGroupId" label="Purchase Tax Group" placeholder="Select tax group" />
            <TextField name="hsnCode" label="HSN Code" placeholder="e.g. 1006" />
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
        <Button type="submit" loadingText="Creating...">
          Add Item
        </Button>
      </DialogActions>
    </Form>
  );
};
