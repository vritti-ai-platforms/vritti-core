import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateInventoryItem } from '@/hooks/inventory-items';
import { type CreateInventoryItemFormData, createInventoryItemSchema } from '@/schemas/inventory-items';

interface AddInventoryItemDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const typeOptions = [
  { value: 'MATERIAL', label: 'Material' },
  { value: 'PRODUCT', label: 'Product' },
];

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
      type: 'MATERIAL',
      tracking: 'lot',
      pickStrategy: 'none',
      categoryId: '',
      description: '',
      uomId: '',
    },
  });

  const tracking = useWatch({ control: form.control, name: 'tracking' });
  const createMutation = useCreateInventoryItem({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <RadioGroup name="type" label="Type" options={typeOptions} orientation="horizontal" />
      <TextField name="name" label="Name" placeholder="e.g. Basmati Rice" />
      <TextField name="code" label="Code" placeholder="e.g. RAW-RICE-BAS" />
      <RadioGroup name="tracking" label="Tracking" options={trackingOptions} />
      {tracking !== 'quantity' && (
        <RadioGroup name="pickStrategy" label="Pick Strategy" options={pickStrategyOptions} />
      )}
      <CategorySelector name="categoryId" />
      <TextArea name="description" label="Description" placeholder="Optional description" />
      <UomSelector name="uomId" label="Unit of Measure" placeholder="Select unit" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Item
        </Button>
      </div>
    </Form>
  );
};
