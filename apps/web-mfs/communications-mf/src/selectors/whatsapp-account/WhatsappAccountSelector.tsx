import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type WhatsappAccountSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for WhatsApp account selection with async search
export const WhatsappAccountSelector = forwardRef<HTMLButtonElement, WhatsappAccountSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="WhatsApp Account"
    placeholder="Select account"
    searchable
    optionsEndpoint="communications-api/select-api/whatsapp-accounts"
    fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
    {...props}
  />
));
WhatsappAccountSelector.displayName = 'WhatsappAccountSelector';
