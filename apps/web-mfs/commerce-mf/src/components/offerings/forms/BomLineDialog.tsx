import { Button } from '@vritti/quantum-ui/Button';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type AddBomLineFormData,
  addBomLineSchema,
  type BomLineData,
  type EditBomLineFormData,
  editBomLineSchema,
  type OfferingVariantData,
} from '@/schemas/offerings';
import type { UseAddBomLine, UseUpdateBomLine } from '../types';

interface AddBomLineDialogProps {
  useAdd: UseAddBomLine;
  variant: OfferingVariantData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Only this line is sent, so a concurrent edit to a sibling line is not clobbered
export const AddBomLineDialog: React.FC<AddBomLineDialogProps> = ({ useAdd, variant, onSuccess, onCancel }) => {
  const form = useForm<AddBomLineFormData>({
    resolver: zodResolver(addBomLineSchema),
    defaultValues: { inventoryItemId: '', quantity: 1, uomId: '' },
  });

  const addMutation = useAdd({ onSuccess });

  return (
    <Form
      form={form}
      mutation={addMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        variantId: variant.id,
        inventoryItemId: data.inventoryItemId,
        quantity: Number(data.quantity),
        uomId: data.uomId,
      })}
    >
      <div className="flex flex-col gap-4">
        <Select
          name="inventoryItemId"
          label="Item"
          placeholder="Select an item"
          optionsEndpoint="commerce-api/select-api/inventory-items"
          fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'sku' }}
          searchable
          description={`This variant's SKU is ${variant.sku} — an item with that code is the usual match.`}
        />
        <div className="flex gap-3">
          <div className="w-32">
            <TextField name="quantity" label="Quantity" type="number" placeholder="1" positive />
          </div>
          <div className="flex-1">
            <Select
              name="uomId"
              label="Unit"
              placeholder="Select a unit"
              optionsEndpoint="commerce-api/select-api/uom"
              fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
              searchable
              description="Converted to the item's stocking unit at fulfilment."
            />
          </div>
        </div>
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Component
        </Button>
      </DialogActions>
    </Form>
  );
};

interface EditBomLineDialogProps {
  useUpdate: UseUpdateBomLine;
  variant: OfferingVariantData;
  line: BomLineData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditBomLineDialog: React.FC<EditBomLineDialogProps> = ({
  useUpdate,
  variant,
  line,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<EditBomLineFormData>({
    resolver: zodResolver(editBomLineSchema),
    defaultValues: { quantity: line.quantity, uomId: line.uomId },
  });

  const updateMutation = useUpdate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        variantId: variant.id,
        lineId: line.id,
        quantity: Number(data.quantity),
        uomId: data.uomId,
      })}
    >
      <div className="flex flex-col gap-4">
        <DetailField label="Item" type="string" value={line.inventoryItemName} />
        <div className="flex gap-3">
          <div className="w-32">
            <TextField name="quantity" label="Quantity" type="number" placeholder="1" positive />
          </div>
          <div className="flex-1">
            <Select
              name="uomId"
              label="Unit"
              placeholder="Select a unit"
              optionsEndpoint="commerce-api/select-api/uom"
              fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
              searchable
              description="Converted to the item's stocking unit at fulfilment."
            />
          </div>
        </div>
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Component
        </Button>
      </DialogActions>
    </Form>
  );
};
