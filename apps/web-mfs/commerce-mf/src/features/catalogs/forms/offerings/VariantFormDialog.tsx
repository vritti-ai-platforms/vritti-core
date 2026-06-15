import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { useCreateVariant, useUpdateVariant } from '@/hooks/offerings';
import {
  buildVariantFormSchema,
  type CreateVariantData,
  type CurrencyAmount,
  type OfferingDetail,
  type OfferingVariant,
  type VariantComponentInput,
} from '@/schemas/offerings';
import { VariantComponentsField } from '../../components/offerings/VariantComponentsField';

interface VariantFormDialogProps {
  catalogId: string;
  offering: OfferingDetail;
  variant?: OfferingVariant;
  onSuccess: () => void;
  onCancel: () => void;
}

interface VariantFormValues {
  components?: VariantComponentInput[];
  price: CurrencyAmount;
  isAvailable: boolean;
  [optionId: string]: string | CurrencyAmount | boolean | VariantComponentInput[] | undefined;
}

export const VariantFormDialog: React.FC<VariantFormDialogProps> = ({
  catalogId,
  offering,
  variant,
  onSuccess,
  onCancel,
}) => {
  const isEdit = !!variant;
  const requireComponents = offering.fulfilmentType === 'STOCK' || offering.fulfilmentType === 'COMPOSITE';
  const showComponents = requireComponents;

  const optionDefaults: Record<string, string> = {};
  for (const option of offering.options) {
    const selected = option.values.find((value) => variant?.optionValueIds.includes(value.id));
    optionDefaults[option.id] = selected?.id ?? '';
  }

  const form = useForm<VariantFormValues>({
    resolver: zodResolver(
      buildVariantFormSchema({ options: offering.options, requireComponents }),
    ) as Resolver<VariantFormValues>,
    defaultValues: {
      ...optionDefaults,
      components: variant?.components.map((c) => ({ inventoryItemId: c.inventoryItemId, quantity: c.quantity })) ?? [],
      price: variant?.price ?? { currency: offering.currencyCode, value: '' },
      isAvailable: variant?.isAvailable ?? true,
    },
  });

  const createMutation = useCreateVariant({ onSuccess });
  const updateMutation = useUpdateVariant({ onSuccess });

  const fields = (
    <>
      {offering.options.map((option) => (
        <Select
          key={option.id}
          name={option.id}
          label={option.name}
          placeholder={`Select ${option.name.toLowerCase()}`}
          options={option.values.map((value) => ({ value: value.id, label: value.value }))}
          disabled={isEdit}
          searchable
          clearable
        />
      ))}

      {showComponents && <VariantComponentsField name="components" />}

      <CurrencyField name="price" label="Price" currencyCode={offering.currencyCode} placeholder="0.00" />

      <Switch
        name="isAvailable"
        label="Available for ordering"
        description="When off, this variant is hidden from POS and order forms"
      />

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText={isEdit ? 'Saving...' : 'Adding...'}>
          {isEdit ? 'Save variant' : 'Add variant'}
        </Button>
      </DialogActions>
    </>
  );

  if (isEdit) {
    return (
      <Form
        form={form}
        mutation={updateMutation}
        resetOnSuccess={false}
        onCancel={onCancel}
        transformSubmit={(data) => ({
          catalogId,
          offeringId: offering.id,
          variantId: variant.id,
          data: {
            price: data.price,
            components: showComponents ? (data.components ?? []) : undefined,
            isAvailable: Boolean(data.isAvailable),
          },
        })}
      >
        {fields}
      </Form>
    );
  }

  const transformCreate = (data: VariantFormValues) => {
    const optionValueIds = offering.options
      .map((option) => data[option.id])
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    const payload: CreateVariantData = {
      optionValueIds,
      components: showComponents ? (data.components ?? []) : undefined,
      price: data.price,
      isAvailable: Boolean(data.isAvailable),
    };

    return { catalogId, offeringId: offering.id, data: payload };
  };

  return (
    <Form form={form} mutation={createMutation} onCancel={onCancel} transformSubmit={transformCreate}>
      {fields}
    </Form>
  );
};
