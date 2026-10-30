import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';
import { CURRENCIES } from './currencies';

export type CurrencySelectorProps = Omit<SelectProps, 'optionsEndpoint'> & {
  excludeCodes?: string[];
  // Offers only these currencies, e.g. the ones a supplier trades in
  includeCodes?: string[];
};

// Pre-configured Select for currency selection with local searchable options
export const CurrencySelector = forwardRef<HTMLButtonElement, CurrencySelectorProps>(
  ({ excludeCodes, includeCodes, ...props }, ref) => (
    <Select
      ref={ref}
      label="Currency"
      placeholder="Select currency"
      searchable
      options={CURRENCIES.filter(
        (c) => (!includeCodes || includeCodes.includes(String(c.value))) && !excludeCodes?.includes(String(c.value)),
      )}
      {...props}
    />
  ),
);
CurrencySelector.displayName = 'CurrencySelector';
