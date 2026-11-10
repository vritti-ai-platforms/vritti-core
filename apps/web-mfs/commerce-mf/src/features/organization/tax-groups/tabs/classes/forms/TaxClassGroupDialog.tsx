import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateTaxClassGroup, useUpdateTaxClassGroup } from '@/hooks/organization/tax-groups';
import {
  type TaxClassGroupData,
  type TaxClassGroupFormData,
  taxClassGroupSchema,
  type UpdateTaxClassGroupPayload,
} from '@/schemas/tax-groups';
import { TaxClassSelector } from '@/selectors/tax-class';
import { TaxGroupSelector } from '@/selectors/tax-group';

interface TaxClassGroupDialogProps {
  countryCode: string;
  // Fixes the group (from a tax group's page) or the class (from the class mapping) the new mapping is for
  taxGroupId?: string;
  taxClassId?: string;
  mapping?: TaxClassGroupData;
  onSuccess: () => void;
  onCancel: () => void;
}

// An empty price limit is sent as none, so the mapping covers every price
function toPayload(data: TaxClassGroupFormData): UpdateTaxClassGroupPayload {
  return {
    maxUnitPrice: data.maxUnitPrice?.value ? data.maxUnitPrice : null,
    validFrom: data.validFrom,
    validTo: data.validTo || null,
  };
}

export const TaxClassGroupDialog: React.FC<TaxClassGroupDialogProps> = ({
  countryCode,
  taxGroupId,
  taxClassId,
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
          taxClassId: mapping.taxClassId,
          maxUnitPrice: mapping.maxUnitPrice ?? undefined,
          validFrom: mapping.validFrom,
          validTo: mapping.validTo ?? undefined,
        }
      : { taxGroupId, taxClassId },
  });

  const createMutation = useCreateTaxClassGroup({ onSuccess });
  const updateMutation = useUpdateTaxClassGroup({ onSuccess });

  const body = (
    <>
      <div className="flex flex-col gap-4">
        {!taxGroupId && !mapping && (
          <TaxGroupSelector
            name="taxGroupId"
            country={countryCode}
            description={`The ${countryCode} tax group the class is taxed by`}
          />
        )}
        <TaxClassSelector
          name="taxClassId"
          disabled={!!taxClassId || !!mapping}
          description={mapping ? 'The class cannot be changed; add a new mapping instead' : undefined}
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
          {mapping ? 'Save Mapping' : 'Map Class'}
        </Button>
      </DialogActions>
    </>
  );

  return mapping ? (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ taxGroupId: mapping.taxGroupId, mappingId: mapping.id, data: toPayload(data) })}
    >
      {body}
    </Form>
  ) : (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        taxGroupId: data.taxGroupId,
        data: { taxClassId: data.taxClassId, ...toPayload(data) },
      })}
    >
      {body}
    </Form>
  );
};
