import Decimal from '@vritti/quantum-ui/decimal';
import type { CurrencyAmount } from '@vritti/quantum-ui/format';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCodeField, zodCurrencyField, zodNumericField } from '@vritti/quantum-ui/zod';
import { countryCodeField } from './tax-jurisdictions';

export const TaxTreatmentValues = {
  TAXABLE: 'TAXABLE',
  ZERO_RATED: 'ZERO_RATED',
  EXEMPT: 'EXEMPT',
  OUT_OF_SCOPE: 'OUT_OF_SCOPE',
} as const;
export type TaxTreatment = (typeof TaxTreatmentValues)[keyof typeof TaxTreatmentValues];
export const TAX_TREATMENTS = Object.values(TaxTreatmentValues) as [TaxTreatment, ...TaxTreatment[]];

export const TAX_TREATMENT_LABELS: Record<TaxTreatment, string> = {
  TAXABLE: 'Taxable',
  ZERO_RATED: 'Zero-rated',
  EXEMPT: 'Exempt',
  OUT_OF_SCOPE: 'Out of scope',
};

export const TAX_TREATMENT_OPTIONS = TAX_TREATMENTS.map((value) => ({ value, label: TAX_TREATMENT_LABELS[value] }));

export const TaxJurisdictionCheckValues = {
  SAME: 'SAME',
  DIFFERENT: 'DIFFERENT',
} as const;
export type TaxJurisdictionCheck = (typeof TaxJurisdictionCheckValues)[keyof typeof TaxJurisdictionCheckValues];
export const TAX_JURISDICTION_CHECKS = Object.values(TaxJurisdictionCheckValues) as [
  TaxJurisdictionCheck,
  ...TaxJurisdictionCheck[],
];

export const TAX_JURISDICTION_CHECK_LABELS: Record<TaxJurisdictionCheck, string> = {
  SAME: 'Same jurisdiction',
  DIFFERENT: 'Different jurisdictions',
};

// What a rate with no jurisdiction check shows: it applies whether or not the supplier is in the same jurisdiction
export const NO_JURISDICTION_CHECK_LABEL = 'Always';

export const TAX_JURISDICTION_CHECK_OPTIONS = TAX_JURISDICTION_CHECKS.map((value) => ({
  value,
  label: TAX_JURISDICTION_CHECK_LABELS[value],
}));

export const TaxCalculationValues = {
  PERCENT: 'PERCENT',
  AMOUNT_PER_MEASURE: 'AMOUNT_PER_MEASURE',
} as const;
export type TaxCalculation = (typeof TaxCalculationValues)[keyof typeof TaxCalculationValues];
export const TAX_CALCULATIONS = Object.values(TaxCalculationValues) as [TaxCalculation, ...TaxCalculation[]];

export const TAX_CALCULATION_LABELS: Record<TaxCalculation, string> = {
  PERCENT: 'Percent of the base',
  AMOUNT_PER_MEASURE: 'Amount per measure',
};

export const TAX_CALCULATION_OPTIONS = TAX_CALCULATIONS.map((value) => ({
  value,
  label: TAX_CALCULATION_LABELS[value],
}));

export const TaxMeasureValues = {
  UNIT: 'UNIT',
  LITRE: 'LITRE',
  PURE_ALCOHOL_LITRE: 'PURE_ALCOHOL_LITRE',
  KG: 'KG',
} as const;
export type TaxMeasure = (typeof TaxMeasureValues)[keyof typeof TaxMeasureValues];
export const TAX_MEASURES = Object.values(TaxMeasureValues) as [TaxMeasure, ...TaxMeasure[]];

export const TAX_MEASURE_LABELS: Record<TaxMeasure, string> = {
  UNIT: 'Per unit',
  LITRE: 'Per litre',
  PURE_ALCOHOL_LITRE: 'Per litre of pure alcohol',
  KG: 'Per kilogram',
};

export const TAX_MEASURE_OPTIONS = TAX_MEASURES.map((value) => ({ value, label: TAX_MEASURE_LABELS[value] }));

export const TaxBaseValues = {
  PRICE: 'PRICE',
  PRICE_PLUS_PREVIOUS: 'PRICE_PLUS_PREVIOUS',
  MRP: 'MRP',
} as const;
export type TaxBase = (typeof TaxBaseValues)[keyof typeof TaxBaseValues];
export const TAX_BASES = Object.values(TaxBaseValues) as [TaxBase, ...TaxBase[]];

export const TAX_BASE_LABELS: Record<TaxBase, string> = {
  PRICE: 'Price',
  PRICE_PLUS_PREVIOUS: 'Price plus earlier taxes',
  MRP: 'MRP',
};

export const TAX_BASE_OPTIONS = TAX_BASES.map((value) => ({ value, label: TAX_BASE_LABELS[value] }));

const validToOnOrAfterValidFrom = {
  check: (data: { validFrom: string; validTo?: string | null }) => !data.validTo || data.validTo >= data.validFrom,
  params: { message: 'Valid to must be on or after valid from', path: ['validTo'] },
};

const taxGroupFields = {
  code: zodCodeField({ max: 50 }),
  name: z.string({ error: 'Name is required' }).min(1, 'Name is required').max(100),
  treatment: z.enum(TAX_TREATMENTS, { error: 'Treatment is required' }),
  legalText: z.string().max(1000),
};

export const createTaxGroupSchema = z.object({
  countryCode: countryCodeField,
  ...taxGroupFields,
  isActive: z.boolean(),
});
export type CreateTaxGroupFormData = z.infer<typeof createTaxGroupSchema>;

// `countryCode` is fixed once the group exists but shown disabled in the edit form, so it belongs to the form type only
export const editTaxGroupFormSchema = z.object({ countryCode: z.string(), ...taxGroupFields });
export type EditTaxGroupFormData = z.infer<typeof editTaxGroupFormSchema>;

export interface TaxGroupData {
  id: string;
  countryCode: string;
  code: string;
  name: string;
  treatment: TaxTreatment;
  legalText: string | null;
  isActive: boolean;
  rateCount: number;
  classCount: number;
  canDelete: boolean;
  canDeactivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaxGroupsTableResponse = TableResponse<TaxGroupData>;

export interface CreateTaxGroupPayload {
  countryCode: string;
  code: string;
  name: string;
  treatment: TaxTreatment;
  legalText: string | null;
  isActive: boolean;
}

export type UpdateTaxGroupPayload = Partial<Omit<CreateTaxGroupPayload, 'countryCode' | 'isActive'>>;

export const taxGroupRateSchema = z
  .object({
    taxComponentId: z.uuid('Component is required'),
    jurisdictionId: z.uuid().nullish(),
    jurisdictionCheck: z.enum(TAX_JURISDICTION_CHECKS).nullish(),
    calculation: z.enum(TAX_CALCULATIONS, { error: 'Calculation is required' }),
    rate: zodNumericField({ nullable: true, min: 0, max: 999.9999 }).optional(),
    amount: zodCurrencyField({ optional: true, positive: true }),
    measure: z.enum(TAX_MEASURES).optional(),
    base: z.enum(TAX_BASES, { error: 'Base is required' }),
    sequence: zodNumericField({ required: 'Sequence is required', min: 0, integer: true }),
    validFrom: z.string({ error: 'Valid from is required' }).min(1, 'Valid from is required'),
    validTo: z.string().nullish(),
  })
  .refine(validToOnOrAfterValidFrom.check, validToOnOrAfterValidFrom.params)
  .superRefine((rate, ctx) => {
    if (rate.calculation === TaxCalculationValues.PERCENT) {
      if (rate.rate == null) ctx.addIssue({ code: 'custom', path: ['rate'], message: 'Rate is required' });
      else if (new Decimal(rate.rate).decimalPlaces() > 4) {
        ctx.addIssue({ code: 'custom', path: ['rate'], message: 'Up to 4 decimal places' });
      }
      return;
    }
    if (!rate.amount?.value) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Amount is required' });
    if (!rate.measure) ctx.addIssue({ code: 'custom', path: ['measure'], message: 'Measure is required' });
  });

export type TaxGroupRateFormData = z.infer<typeof taxGroupRateSchema>;

export interface TaxGroupRateData {
  id: string;
  taxGroupId: string;
  taxComponentId: string;
  taxComponentCode: string;
  taxComponentName: string;
  jurisdictionId: string | null;
  jurisdictionName: string | null;
  jurisdictionCheck: TaxJurisdictionCheck | null;
  calculation: TaxCalculation;
  rate: number | null;
  amount: CurrencyAmount | null;
  measure: TaxMeasure | null;
  base: TaxBase;
  sequence: number;
  validFrom: string;
  validTo: string | null;
  isCurrent: boolean;
}

export type TaxGroupRatesTableResponse = TableResponse<TaxGroupRateData>;

export interface TaxGroupRatesContext {
  jurisdiction?: string;
  asOf?: string;
}

// A percent rate clears the amount and measure, an amount per measure clears the rate — the server keeps one shape
export interface TaxGroupRatePayload {
  taxComponentId: string;
  jurisdictionId: string | null;
  jurisdictionCheck: TaxJurisdictionCheck | null;
  calculation: TaxCalculation;
  rate: number | null;
  amount: CurrencyAmount | null;
  measure: TaxMeasure | null;
  base: TaxBase;
  sequence: number;
  validFrom: string;
  validTo: string | null;
}

export const taxClassGroupSchema = z
  .object({
    taxGroupId: z.uuid('Tax group is required'),
    taxClassId: z.uuid('Tax class is required'),
    maxUnitPrice: zodCurrencyField({ optional: true, positive: true }),
    validFrom: z.string({ error: 'Valid from is required' }).min(1, 'Valid from is required'),
    validTo: z.string().nullish(),
  })
  .refine(validToOnOrAfterValidFrom.check, validToOnOrAfterValidFrom.params);

export type TaxClassGroupFormData = z.infer<typeof taxClassGroupSchema>;

export interface TaxClassGroupData {
  id: string;
  countryCode: string;
  taxClassId: string;
  taxClassCode: string;
  taxClassName: string;
  taxGroupId: string;
  taxGroupCode: string;
  taxGroupName: string;
  maxUnitPrice: CurrencyAmount | null;
  validFrom: string;
  validTo: string | null;
  isCurrent: boolean;
}

export type TaxClassGroupsTableResponse = TableResponse<TaxClassGroupData>;

export interface CreateTaxClassGroupPayload {
  taxClassId: string;
  maxUnitPrice: CurrencyAmount | null;
  validFrom: string;
  validTo: string | null;
}

export type UpdateTaxClassGroupPayload = Omit<CreateTaxClassGroupPayload, 'taxClassId'>;
