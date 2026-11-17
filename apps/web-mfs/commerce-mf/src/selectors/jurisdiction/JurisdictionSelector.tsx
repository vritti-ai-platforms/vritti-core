import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';
import { LEVEL_LABELS, LEVELS } from '@/schemas/tax-jurisdictions';

export type JurisdictionSelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint'> & {
  country: string | undefined;
};

// The jurisdiction's code, then its level
function describeJurisdiction(code: string, option: SelectOption): string {
  const level = LEVELS.find((value) => value === option.additionals?.level);
  return [code, level && LEVEL_LABELS[level]].filter(Boolean).join(' · ');
}

// Pre-configured Select over one country's tax jurisdictions; inert until the country is known
export const JurisdictionSelector = forwardRef<HTMLButtonElement, JurisdictionSelectorProps>(
  ({ country, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Jurisdiction"
      placeholder={country ? 'Select jurisdiction' : 'Select a country first'}
      searchable
      fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code', additionalKeys: 'level' }}
      transformDescription={describeJurisdiction}
      {...props}
      disabled={!country || props.disabled}
      optionsEndpoint={country ? 'commerce-api/select-api/tax-jurisdictions' : undefined}
      params={country ? { ...params, country } : undefined}
    />
  ),
);
JurisdictionSelector.displayName = 'JurisdictionSelector';
