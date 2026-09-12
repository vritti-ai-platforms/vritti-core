import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { buildAddVariantSchema, deriveSku, type OfferingData, type OfferingDimensionData } from '@/schemas/offerings';
import type { UseCreateVariant } from '../types';

interface AddVariantDialogProps {
  offering: OfferingData;
  dimensions: OfferingDimensionData[];
  useCreate: UseCreateVariant;
  onSuccess: () => void;
  onCancel: () => void;
}

// The matrix wizard covers batches; this is the one-off — a single combination picked by hand. The
// SKU is still derived, never typed, so a hand-added variant is indistinguishable from a generated one.
export const AddVariantDialog: React.FC<AddVariantDialogProps> = ({
  offering,
  dimensions,
  useCreate,
  onSuccess,
  onCancel,
}) => {
  const schema = useMemo(() => buildAddVariantSchema(dimensions), [dimensions]);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ...Object.fromEntries(dimensions.map((dimension) => [dimension.id, ''])),
      salesUomId: '',
      externalSku: '',
    },
  });

  const values = useWatch({ control: form.control });
  const createMutation = useCreate({ onSuccess });

  // Mirrors what the server will derive, so the SKU is visible before committing to it
  const skuPreview = useMemo(() => {
    const valueIds = dimensions.map((dimension) => (values as Record<string, string>)[dimension.id]);
    return valueIds.every(Boolean) ? deriveSku(offering.code, dimensions, valueIds) : null;
  }, [dimensions, values, offering.code]);

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        offeringId: offering.id,
        salesUomId: data.salesUomId,
        valueIds: dimensions.map((dimension) => (data as Record<string, string>)[dimension.id]),
        externalSku: data.externalSku || null,
      })}
    >
      <div className="flex flex-col gap-4">
        {dimensions.map((dimension) => (
          <Select
            key={dimension.id}
            name={dimension.id}
            label={dimension.name}
            placeholder={`Select ${dimension.name.toLowerCase()}`}
            options={dimension.values.map((value) => ({ value: value.id, label: value.value }))}
          />
        ))}

        <Select
          name="salesUomId"
          label="Sold in"
          placeholder="Select a unit"
          searchable
          optionsEndpoint="commerce-api/select-api/uom"
          fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
          description="How a customer buys one of these."
        />

        <TextField
          name="externalSku"
          label="External SKU"
          placeholder="Optional"
          description="A marketplace or barcode reference. The internal SKU is always derived."
        />

        {skuPreview && <Alert variant="default" title="SKU" description={skuPreview} />}
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Variant
        </Button>
      </DialogActions>
    </Form>
  );
};
