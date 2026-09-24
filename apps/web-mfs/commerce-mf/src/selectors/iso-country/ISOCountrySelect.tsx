import {
  Select,
  SelectFilter,
  type SelectFilterProps,
  type SelectOption,
  type SelectProps,
} from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';
import { countryFlag, ISO_COUNTRIES } from './iso-countries';

// Base Select has no custom option render slot, so the flag is baked into the label string.
const ISO_COUNTRY_OPTIONS: SelectOption[] = ISO_COUNTRIES.map(({ code, name }) => ({
  value: code,
  label: `${countryFlag(code)} ${name}`,
}));

export type ISOCountrySelectProps = Omit<SelectProps, 'optionsEndpoint' | 'options'>;

// Pre-configured Select for ISO 3166-1 alpha-2 country selection with a baked-in static list.
export const ISOCountrySelect = forwardRef<HTMLButtonElement, ISOCountrySelectProps>((props, ref) => (
  <Select ref={ref} label="Country" placeholder="Select country" searchable options={ISO_COUNTRY_OPTIONS} {...props} />
));
ISOCountrySelect.displayName = 'ISOCountrySelect';

export type ISOCountryFilterProps = Omit<SelectFilterProps, 'optionsEndpoint' | 'options' | 'name'> & {
  name?: string;
};

// Pre-configured SelectFilter for ISO 3166-1 alpha-2 country filtering with a baked-in static list.
export const ISOCountryFilter = Object.assign(
  forwardRef<HTMLButtonElement, ISOCountryFilterProps>((props, ref) => (
    <SelectFilter
      ref={ref}
      name="country"
      label="Country"
      placeholder="Select country"
      options={ISO_COUNTRY_OPTIONS}
      {...props}
    />
  )),
  { displayName: 'ISOCountryFilter', defaultLabel: 'Country', defaultName: 'country' },
);
