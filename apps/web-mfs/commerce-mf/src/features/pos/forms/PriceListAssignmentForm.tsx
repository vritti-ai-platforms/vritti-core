// Plain form for assigning or editing a price list on a POS terminal
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { terminalPriceListAssignmentSchema } from '@/schemas/price-lists';

type PriceListAssignmentFormData = z.infer<typeof terminalPriceListAssignmentSchema>;

interface PriceListAssignmentFormProps {
  defaultValues: { priceListId: string; priority: string; isDefault: boolean };
  excludedPriceListIds: string[];
  submitLabel: string;
  onSubmit: (values: PriceListAssignmentFormData) => void;
  onCancel: () => void;
}

export const PriceListAssignmentForm: React.FC<PriceListAssignmentFormProps> = ({
  defaultValues,
  excludedPriceListIds,
  submitLabel,
  onSubmit,
  onCancel,
}) => {
  const form = useForm<PriceListAssignmentFormData>({
    resolver: zodResolver(terminalPriceListAssignmentSchema),
    defaultValues,
  });

  const params = useMemo(
    () => (excludedPriceListIds.length > 0 ? { excludeIds: excludedPriceListIds.join(',') } : undefined),
    [excludedPriceListIds],
  );

  return (
    <Form form={form} onSubmit={onSubmit} onCancel={onCancel}>
      <div className="space-y-4">
        <Select
          name="priceListId"
          label="Price List"
          placeholder="Select price list"
          searchable
          optionsEndpoint="commerce-api/price-lists/select"
          fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
          params={params}
        />
        <TextField name="priority" label="Priority" type="number" min={0} placeholder="0" />
        <Switch name="isDefault" label="Default Price List" />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </Form>
  );
};
