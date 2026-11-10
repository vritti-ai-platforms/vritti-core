import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateTaxClassGroupMapping, useUpdateTaxClassGroupMapping } from '@/hooks/organization/tax-classes';
import type { UpdateTaxClassGroupMappingPayload } from '@/schemas/tax-classes';
import { type TaxClassGroupData, type TaxClassGroupFormData, taxClassGroupSchema } from '@/schemas/tax-groups';
import { TaxGroupSelector } from '@/selectors/tax-group';

interface TaxClassGroupMappingDialogProps {
  taxClassId: string;
  countryCode: string;
  mapping?: TaxClassGroupData;
  onSuccess: () => void;
  onCancel: () => void;
}

// An empty price limit is sent as none, so the mapping covers every price
function toPayload(data: TaxClassGroupFormData): UpdateTaxClassGroupMappingPayload {
  return {
    maxUnitPrice: data.maxUnitPrice?.value ? data.maxUnitPrice : null,
    validFrom: data.validFrom,
    validTo: data.validTo || null,
  };
}

export const TaxClassGroupMappingDialog: React.FC<TaxClassGroupMappingDialogProps> = ({
  taxClassId,
  countryCode,
  mapping,
  onSuccess,
  onCancel,
}) => {
  const workspaceCurrency = useWorkspaceCurrency();
  const form = useForm<TaxClassGroupFormData>({
    resolver: zodResolver(taxClassGroupSchema),
    defaultValues: mapping
      ? {
          taxGroupId: mapping.taxGroupId,
          taxClassId,
          maxUnitPrice: mapping.maxUnitPrice ?? undefined,
          validFrom: mapping.validFrom,
          validTo: mapping.validTo ?? undefined,
        }
      : { taxClassId },
  });

  const createMutation = useCreateTaxClassGroupMapping({ onSuccess });
  const updateMutation = useUpdateTaxClassGroupMapping({ onSuccess });

  const body = (
    <>
      <div className="flex flex-col gap-4">
        <TaxGroupSelector
          name="taxGroupId"
          country={countryCode}
          disabled={!!mapping}
          description={
            mapping
              ? 'The group cannot be changed; add a new mapping instead'
              : `The ${countryCode} tax group the class is taxed by`
          }
        />
        <CurrencyField
          name="maxUnitPrice"
          label="Max Unit Price (optional)"
          defaultCurrencyCode={workspaceCurrency}
          description="Only unit prices up to this amount use the group, e.g. clothing up to 2,500 rupees"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DatePicker name="validFrom" label="Valid From" />
          <DatePicker name="validTo" label="Valid To (optional)" />
        </div>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          {mapping ? 'Save Mapping' : 'Map Group'}
        </Button>
      </DialogActions>
    </>
  );

  return mapping ? (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ taxClassId, mappingId: mapping.id, data: toPayload(data) })}
    >
      {body}
    </Form>
  ) : (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({ taxClassId, data: { taxGroupId: data.taxGroupId, ...toPayload(data) } })}
    >
      {body}
    </Form>
  );
};
