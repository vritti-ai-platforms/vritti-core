import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type SupplierSelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint'> & { activeOnly?: boolean };

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'displayName',
  descriptionKey: 'currencyCode',
  additionalKeys: 'currencyCode,currencyCodes,purchasingBlocked',
} as const;

// Currencies, then whether it supplies the picker's item at the site, then a purchasing block
function defaultTransformDescription(value: string, option: SelectOption): string {
  const additionals = option.additionals ?? {};
  const currencyCode = Array.isArray(additionals.currencyCodes)
    ? additionals.currencyCodes.join(', ')
    : typeof additionals.currencyCode === 'string'
      ? additionals.currencyCode.trim()
      : '';
  const supplies = additionals.suppliesItem === true ? 'Supplies this item' : '';
  const blocked = additionals.purchasingBlocked === true ? 'Purchasing blocked' : '';
  const parts = [currencyCode || value, supplies, blocked].filter(Boolean);
  return parts.join(' · ');
}

// Pre-configured Select for supplier selection with async search; form pickers offer only active suppliers
export const SupplierSelector = forwardRef<HTMLButtonElement, SupplierSelectorProps>(
  ({ fieldKeys, activeOnly = true, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Supplier"
      placeholder="Select supplier"
      searchable
      optionsEndpoint="commerce-api/select-api/suppliers"
      transformDescription={defaultTransformDescription}
      {...props}
      params={activeOnly ? { ...params, activeOnly: true } : params}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
SupplierSelector.displayName = 'SupplierSelector';
