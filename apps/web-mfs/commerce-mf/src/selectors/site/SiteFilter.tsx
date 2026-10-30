import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type SiteFilterProps = Omit<SelectFilterProps, 'optionsEndpoint' | 'name'> & {
  name?: string;
  // Offers only these sites, e.g. the ones a record has data at; every site of the legal entity when omitted
  siteIds?: string[];
};

// Pre-configured SelectFilter for site filtering with async search
export const SiteFilter = Object.assign(
  forwardRef<HTMLButtonElement, SiteFilterProps>(({ siteIds, params, ...props }, ref) => (
    <SelectFilter
      ref={ref}
      name="siteId"
      label="Site"
      placeholder="Select site"
      optionsEndpoint="select-api/sites"
      fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
      params={siteIds ? { ...params, ids: siteIds.join(',') } : params}
      {...props}
    />
  )),
  { displayName: 'SiteFilter', defaultLabel: 'Site', defaultName: 'siteId' },
);
