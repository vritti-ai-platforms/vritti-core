import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { BomSelector } from '@vritti/quantum-ui/selects/bom';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useCreateConversion } from '@/hooks/useCreateConversion';
import { type CreateConversionFormData, createConversionSchema } from '@/schemas/conversions';

interface CreateConversionDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const emptyLine = { inventoryItemId: '', quantity: '', wastageQuantity: '' };

export const CreateConversionDialog: React.FC<CreateConversionDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateConversionFormData>({
    resolver: zodResolver(createConversionSchema),
    defaultValues: {
      bomId: '',
      locationId: undefined,
      notes: '',
      inputs: [{ ...emptyLine }],
      outputs: [{ ...emptyLine }],
    },
  });

  const inputFields = useFieldArray({ control: form.control, name: 'inputs' });
  const outputFields = useFieldArray({ control: form.control, name: 'outputs' });

  const createMutation = useCreateConversion({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
     
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        bomId: data.bomId || undefined,
        locationId: data.locationId,
        notes: data.notes || undefined,
        inputs: data.inputs.map((i) => ({
          inventoryItemId: i.inventoryItemId,
          quantity: Number(i.quantity),
          wastageQuantity: i.wastageQuantity ? Number(i.wastageQuantity) : undefined,
        })),
        outputs: data.outputs.map((o) => ({
          inventoryItemId: o.inventoryItemId,
          quantity: Number(o.quantity),
          wastageQuantity: o.wastageQuantity ? Number(o.wastageQuantity) : undefined,
        })),
      })}
    >
      <BomSelector name="bomId" label="BOM (Optional)" placeholder="Select BOM" />
      <LocationSelector name="locationId" label="Location" placeholder="Select location" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Inputs</p>
          <Button type="button" variant="outline" size="sm" onClick={() => inputFields.append({ ...emptyLine })}>
            <Plus className="mr-1 size-3" />
            Add Input
          </Button>
        </div>
        {inputFields.fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <div className="flex-1">
              <InventoryItemSelector name={`inputs.${index}.inventoryItemId`} label="Item" placeholder="Select item" />
            </div>
            <div className="w-24">
              <TextField name={`inputs.${index}.quantity`} label="Qty" type="number" placeholder="0" />
            </div>
            <div className="w-24">
              <TextField name={`inputs.${index}.wastageQuantity`} label="Wastage" type="number" placeholder="0" />
            </div>
            {inputFields.fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-7"
                onClick={() => inputFields.remove(index)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Outputs</p>
          <Button type="button" variant="outline" size="sm" onClick={() => outputFields.append({ ...emptyLine })}>
            <Plus className="mr-1 size-3" />
            Add Output
          </Button>
        </div>
        {outputFields.fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <div className="flex-1">
              <InventoryItemSelector name={`outputs.${index}.inventoryItemId`} label="Item" placeholder="Select item" />
            </div>
            <div className="w-24">
              <TextField name={`outputs.${index}.quantity`} label="Qty" type="number" placeholder="0" />
            </div>
            <div className="w-24">
              <TextField name={`outputs.${index}.wastageQuantity`} label="Wastage" type="number" placeholder="0" />
            </div>
            {outputFields.fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-7"
                onClick={() => outputFields.remove(index)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Conversion
        </Button>
      </div>
    </Form>
  );
};
