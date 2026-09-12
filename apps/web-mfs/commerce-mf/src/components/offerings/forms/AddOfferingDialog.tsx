import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { TaxClassSelector } from '@vritti/quantum-ui/selects/tax-class';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  type CreateOfferingFormData,
  createOfferingSchema,
  FULFILMENT_TYPE_META,
  FULFILMENT_TYPES,
  toCode,
} from '@/schemas/offerings';
import type { UseCreateOffering } from '../types';

const TYPE_OPTIONS = FULFILMENT_TYPES.map((value) => ({
  value,
  label: FULFILMENT_TYPE_META[value].label,
  description: FULFILMENT_TYPE_META[value].description,
}));

interface AddOfferingDialogProps {
  useCreate: UseCreateOffering;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddOfferingDialog: React.FC<AddOfferingDialogProps> = ({ useCreate, onSuccess, onCancel }) => {
  const form = useForm<CreateOfferingFormData>({
    resolver: zodResolver(createOfferingSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      categoryId: null,
      fulfilmentType: 'STOCK',
      taxClassId: '',
    },
  });

  const name = useWatch({ control: form.control, name: 'name' });

  // Derive the code from the name until the operator edits the code themselves. The code becomes a
  // prefix of every variant SKU, so it is worth getting right without making them type it twice.
  useEffect(() => {
    if (!form.formState.dirtyFields.code) form.setValue('code', toCode(name ?? ''));
  }, [name, form]);

  const createMutation = useCreate({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="flex flex-col gap-6">
        <FormSection title="Identity" contentClassName="block">
          <div className="grid grid-cols-2 gap-4">
            <TextField name="name" label="Name" placeholder="e.g. Classic Cotton T-Shirt" />
            <TextField
              name="code"
              label="Code"
              placeholder="e.g. tshirt-classic"
              description="Unique per organization. Prefixes every variant SKU, so it is fixed once created."
            />
            <div className="col-span-2">
              <TextArea name="description" label="Description" placeholder="Optional" />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Fulfilment"
          description="What happens at picking. This decides what each variant's bill of materials must contain, and cannot be changed later."
          contentClassName="block"
        >
          <RadioGroup name="fulfilmentType" variant="card" orientation="horizontal" options={TYPE_OPTIONS} />
        </FormSection>

        <FormSection
          title="Classification"
          description="A category prefills the tax class. There is no inheritance at read time — the offering keeps its own copy from then on."
          contentClassName="block"
        >
          <div className="grid grid-cols-2 gap-4">
            <CategorySelector
              name="categoryId"
              clearable
              fieldKeys={{ valueKey: 'id', labelKey: 'name', additionalKeys: 'defaultTaxClassId' }}
              onOptionSelect={(option) => {
                const fromCategory = option?.additionals?.defaultTaxClassId as string | undefined;
                if (fromCategory) {
                  form.setValue('taxClassId', fromCategory, { shouldValidate: true, shouldDirty: true });
                }
              }}
            />
            <TaxClassSelector
              name="taxClassId"
              description="What this is for tax purposes. The rate resolves per legal entity at sale time."
            />
          </div>
        </FormSection>
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Offering
        </Button>
      </DialogActions>
    </Form>
  );
};
