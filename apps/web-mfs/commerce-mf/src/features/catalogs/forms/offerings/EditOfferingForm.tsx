import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { VariantOptionSelector } from '@vritti/quantum-ui/selects/variant-option';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateOffering } from '@/hooks/offerings';
import { useTaxGroups } from '@/hooks/tax-groups';
import { type OfferingDetail, type UpdateOfferingFormData, updateOfferingSchema } from '@/schemas/offerings';

interface EditOfferingFormProps {
  catalogId: string;
  offering: OfferingDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditOfferingForm: React.FC<EditOfferingFormProps> = ({ catalogId, offering, onSuccess, onCancel }) => {
  const axesLocked = offering.variants.length > 0;

  const form = useForm<UpdateOfferingFormData>({
    resolver: zodResolver(updateOfferingSchema),
    defaultValues: {
      name: offering.name,
      description: offering.description ?? '',
      salesTaxGroupId: offering.salesTaxGroupId ?? undefined,
      categoryId: offering.categoryId ?? undefined,
      isAvailable: offering.isAvailable,
      variantOptionIds: offering.options.map((option) => option.id),
    },
  });

  const updateMutation = useUpdateOffering({ onSuccess });
  const { data: taxGroups = [] } = useTaxGroups(offering.businessUnitId);
  const taxGroupOptions = taxGroups.map((tg) => ({
    value: tg.id,
    label: tg.name,
    description: tg.taxRates.map((r) => `${r.name} ${r.rate}%`).join(', '),
  }));

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        catalogId,
        offeringId: offering.id,
        data: {
          name: data.name,
          description: data.description,
          categoryId: data.categoryId ?? null,
          salesTaxGroupId: data.salesTaxGroupId || null,
          isAvailable: data.isAvailable,
          variantOptionIds: data.variantOptionIds ?? [],
        },
      })}
    >
      <TextField name="name" label="Name" placeholder="Offering name" />

      <div className="grid grid-cols-2 gap-4">
        <CategorySelector name="categoryId" params={{ buId: offering.businessUnitId, status: 'active' }} clearable />
        <Select
          name="salesTaxGroupId"
          label="Sales Tax Group"
          placeholder="Select tax group (optional)"
          options={taxGroupOptions}
        />
      </div>

      <TextArea name="description" label="Description" placeholder="Optional description" rows={3} />

      <VariantOptionSelector
        name="variantOptionIds"
        catalogId={catalogId}
        label="Variant options"
        clearable
        disabled={axesLocked}
        description={
          axesLocked
            ? 'Locked while this offering has variants. Remove all variants to change them.'
            : 'Dimensions this offering varies along (e.g. Size, Color).'
        }
      />

      <Switch
        name="isAvailable"
        label="Available for ordering"
        description="When off, the offering is hidden from POS and order forms"
      />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
