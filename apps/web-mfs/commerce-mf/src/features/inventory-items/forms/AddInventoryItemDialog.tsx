import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateInventoryItem } from '@/hooks/useCreateInventoryItem';
import { type CreateInventoryItemFormData, createInventoryItemSchema } from '@/schemas/inventory-items';

interface AddInventoryItemDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const typeOptions = [
  { value: 'MATERIAL', label: 'Material' },
  { value: 'PRODUCT', label: 'Product' },
];

export const AddInventoryItemDialog: React.FC<AddInventoryItemDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateInventoryItemFormData>({
    resolver: zodResolver(createInventoryItemSchema),
    defaultValues: {
      name: '',
      code: '',
      type: 'MATERIAL',
      description: '',
      uomId: undefined,
      requiresShipping: false,
    },
  });

  const createMutation = useCreateInventoryItem({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
    >
      <RadioGroup name="type" label="Type" options={typeOptions} orientation="horizontal" />
      <TextField name="name" label="Name" placeholder="e.g. Basmati Rice" />
      <TextField name="code" label="Code" placeholder="e.g. RAW-RICE-BAS" />
      <TextArea name="description" label="Description" placeholder="Optional description" />
      <UomSelector name="uomId" label="Unit of Measure" placeholder="Select unit" />
      <Switch name="requiresShipping" label="Requires Shipping" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Item
        </Button>
      </div>
    </Form>
  );
};
