import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type CreateVariantInventoryItemFormData,
  createVariantInventoryItemSchema,
  inventoryItemTypeOptions,
  pickStrategyOptions,
  trackingOptions,
} from '@/schemas/inventory-items';
import type { OfferingVariantData } from '@/schemas/offerings';
import { CategorySelector } from '@/selectors/category';
import { UomSelector } from '@/selectors/uom';
import type { UseCreateVariantInventoryItem } from '../types';

interface CreateVariantInventoryItemDialogProps {
  useCreate: UseCreateVariantInventoryItem;
  variant: OfferingVariantData;
  onSuccess: () => void;
  onCancel: () => void;
}

// The inventory counterpart of a STOCK variant. Its SKU is the variant's and is not editable — that
// correspondence is the whole point — so the form asks only for what an item needs beyond it.
export const CreateVariantInventoryItemDialog: React.FC<CreateVariantInventoryItemDialogProps> = ({
  useCreate,
  variant,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateVariantInventoryItemFormData>({
    resolver: zodResolver(createVariantInventoryItemSchema),
    defaultValues: {
      name: variant.name,
      type: 'FINISHED_GOOD',
      tracking: 'lot',
      pickStrategy: 'none',
      categoryId: '',
      uomId: variant.salesUomId,
      description: '',
      hsnCode: '',
    },
  });

  const createMutation = useCreate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        variantId: variant.id,
        name: data.name,
        type: data.type,
        tracking: data.tracking,
        pickStrategy: data.pickStrategy,
        categoryId: data.categoryId,
        uomId: data.uomId,
        description: data.description || null,
        hsnCode: data.hsnCode || null,
      })}
    >
      <div className="flex flex-col gap-6">
        <Alert
          variant="default"
          title={`SKU ${variant.sku}`}
          description="Taken from the variant, so the two always agree. The new item becomes this variant's single component."
        />

        <FormSection title="Basic Info" contentClassName="block">
          <div className="grid grid-cols-3 gap-4">
            <TextField name="name" label="Name" placeholder="e.g. Basmati Rice" />
            <Select name="type" label="Type" placeholder="Select type" options={inventoryItemTypeOptions} />
            <UomSelector name="uomId" label="Stocking Unit" placeholder="Select unit" />
            <div className="col-span-2">
              <CategorySelector name="categoryId" label="Category" placeholder="Select category" />
            </div>
          </div>
        </FormSection>

        <FormSection title="Stock Handling" contentClassName="block">
          <div className="grid grid-cols-2 gap-4">
            <Select name="tracking" label="Tracking" placeholder="Select tracking" options={trackingOptions} />
            <Select
              name="pickStrategy"
              label="Pick Strategy"
              placeholder="Select strategy"
              options={pickStrategyOptions}
            />
          </div>
        </FormSection>

        <FormSection title="Details" contentClassName="block">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <TextArea name="description" label="Description" placeholder="Optional" />
            </div>
            <TextField name="hsnCode" label="HSN Code" placeholder="e.g. 1006" />
          </div>
        </FormSection>
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create and Link
        </Button>
      </DialogActions>
    </Form>
  );
};
