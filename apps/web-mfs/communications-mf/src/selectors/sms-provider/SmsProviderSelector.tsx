import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type SmsProviderSelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for SMS provider selection with async search — the org's own providers plus Vritti's senders
export const SmsProviderSelector = forwardRef<HTMLButtonElement, SmsProviderSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="SMS Provider"
    placeholder="Select provider"
    searchable
    optionsEndpoint="communications-api/select-api/sms-providers"
    fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
    {...props}
  />
));
SmsProviderSelector.displayName = 'SmsProviderSelector';
