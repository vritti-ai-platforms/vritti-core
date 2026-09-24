import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';
import { CURRENCIES } from './currencies';

export type CurrencyFilterProps = Omit<SelectFilterProps, 'options' | 'name'> & {
  name?: string;
  excludeCodes?: string[];
};

// Pre-configured SelectFilter for currency filtering with static local options
export const CurrencyFilter = Object.assign(
  forwardRef<HTMLButtonElement, CurrencyFilterProps>(({ excludeCodes, ...props }, ref) => {
    const options = excludeCodes?.length
      ? CURRENCIES.filter((c) => !excludeCodes.includes(String(c.value)))
      : CURRENCIES;
    return (
      <SelectFilter
        ref={ref}
        name="currency"
        label="Currency"
        placeholder="Select currency"
        options={options}
        {...props}
      />
    );
  }),
  { displayName: 'CurrencyFilter', defaultLabel: 'Currency', defaultName: 'currency' },
);
