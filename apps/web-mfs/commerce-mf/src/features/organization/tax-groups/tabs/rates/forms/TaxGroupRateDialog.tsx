import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import { Select } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateTaxGroupRate, useUpdateTaxGroupRate } from '@/hooks/organization/tax-groups';
import {
  NO_JURISDICTION_CHECK_LABEL,
  TAX_BASE_OPTIONS,
  TAX_CALCULATION_OPTIONS,
  TAX_JURISDICTION_CHECK_OPTIONS,
  TAX_MEASURE_OPTIONS,
  TaxBaseValues,
  TaxCalculationValues,
  type TaxGroupData,
  type TaxGroupRateData,
  type TaxGroupRateFormData,
  type TaxGroupRatePayload,
  taxGroupRateSchema,
} from '@/schemas/tax-groups';
import { JurisdictionSelector } from '@/selectors/jurisdiction';
import { TaxComponentSelector } from '@/selectors/tax-component';

interface TaxGroupRateDialogProps {
  taxGroup: TaxGroupData;
  rate?: TaxGroupRateData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Sends only the fields of the chosen calculation, clearing the other kind so the rate keeps one shape
function toPayload(data: TaxGroupRateFormData): TaxGroupRatePayload {
  const isPercent = data.calculation === TaxCalculationValues.PERCENT;
  return {
    taxComponentId: data.taxComponentId,
    jurisdictionId: data.jurisdictionId ?? null,
    jurisdictionCheck: data.jurisdictionCheck ?? null,
    calculation: data.calculation,
    rate: isPercent ? (data.rate ?? null) : null,
    amount: isPercent ? null : (data.amount ?? null),
    measure: isPercent ? null : (data.measure ?? null),
    base: data.base,
    sequence: data.sequence,
    validFrom: data.validFrom,
    validTo: data.validTo || null,
  };
}

export const TaxGroupRateDialog: React.FC<TaxGroupRateDialogProps> = ({ taxGroup, rate, onSuccess, onCancel }) => {
  const workspaceCurrency = useWorkspaceCurrency();
  const form = useForm<TaxGroupRateFormData>({
    resolver: zodResolver(taxGroupRateSchema),
    defaultValues: rate
      ? {
          taxComponentId: rate.taxComponentId,
          jurisdictionId: rate.jurisdictionId ?? undefined,
          jurisdictionCheck: rate.jurisdictionCheck ?? undefined,
          calculation: rate.calculation,
          rate: rate.rate,
          amount: rate.amount ?? undefined,
          measure: rate.measure ?? undefined,
          base: rate.base,
          sequence: rate.sequence,
          validFrom: rate.validFrom,
          validTo: rate.validTo ?? undefined,
        }
      : {
          calculation: TaxCalculationValues.PERCENT,
          rate: null,
          base: TaxBaseValues.PRICE,
          sequence: 1,
        },
  });
  const calculation = useWatch({ control: form.control, name: 'calculation' });

  const createMutation = useCreateTaxGroupRate({ onSuccess });
  const updateMutation = useUpdateTaxGroupRate({ onSuccess });

  const body = (
    <>
      <FormSection title="Applies to" contentClassName="block">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TaxComponentSelector
            name="taxComponentId"
            label="Component"
            country={taxGroup.countryCode}
            description={`A tax component of ${taxGroup.countryCode}`}
          />
          <JurisdictionSelector
            name="jurisdictionId"
            label="State"
            placeholder="Whole country"
            country={taxGroup.countryCode}
            clearable
            description="Leave empty when the rate holds across the whole country"
          />
          <Select
            name="jurisdictionCheck"
            label="Jurisdiction Check"
            placeholder={NO_JURISDICTION_CHECK_LABEL}
            options={TAX_JURISDICTION_CHECK_OPTIONS}
            clearable
            description="Whether the supplier must be in the same state as the place of supply (CGST, SGST) or another (IGST)"
          />
          <Select name="base" label="Base" options={TAX_BASE_OPTIONS} description="The amount the rate applies to" />
        </div>
      </FormSection>
      <FormSection title="Rate" contentClassName="block">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select name="calculation" label="Calculation" options={TAX_CALCULATION_OPTIONS} />
          {calculation === TaxCalculationValues.PERCENT ? (
            <TextField name="rate" label="Rate (%)" type="number" placeholder="e.g. 2.5" />
          ) : (
            <>
              <CurrencyField name="amount" label="Amount" defaultCurrencyCode={workspaceCurrency} />
              <Select name="measure" label="Measure" placeholder="Select measure" options={TAX_MEASURE_OPTIONS} />
            </>
          )}
          <TextField
            name="sequence"
            label="Sequence"
            type="number"
            integer
            placeholder="1"
            description="Lower sequences apply first; a later one can tax the earlier taxes"
          />
        </div>
      </FormSection>
      <FormSection title="Validity" contentClassName="block">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DatePicker name="validFrom" label="Valid From" />
          <DatePicker name="validTo" label="Valid To (optional)" />
        </div>
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          {rate ? 'Save Rate' : 'Add Rate'}
        </Button>
      </DialogActions>
    </>
  );

  return rate ? (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ taxGroupId: taxGroup.id, rateId: rate.id, data: toPayload(data) })}
    >
      {body}
    </Form>
  ) : (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({ taxGroupId: taxGroup.id, data: toPayload(data) })}
    >
      {body}
    </Form>
  );
};
