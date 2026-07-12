import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { TaxGroupSelector } from '@vritti/quantum-ui/selects/tax-group';
import { VariantOptionSelector } from '@vritti/quantum-ui/selects/variant-option';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type OfferingDetail, type UpdateOfferingFormData, updateOfferingSchema } from '@/schemas/offerings';
import { useUpdateOffering } from '@/hooks/site/offerings';

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
          salesTaxGroupId: data.salesTaxGroupId,
          isAvailable: data.isAvailable,
          variantOptionIds: data.variantOptionIds ?? [],
        },
      })}
    >
      <TextField name="name" label="Name" placeholder="Offering name" />

      <div className="grid grid-cols-2 gap-4">
        <CategorySelector name="categoryId" clearable />
        <TaxGroupSelector name="salesTaxGroupId" label="Sales Tax Group" placeholder="Select tax group" />
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

      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
