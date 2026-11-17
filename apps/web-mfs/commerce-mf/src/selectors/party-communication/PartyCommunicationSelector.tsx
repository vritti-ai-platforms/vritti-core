import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';
import type { CommunicationChannel } from '@/schemas/party-communications';

export type PartyCommunicationSelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint'> & {
  partyId: string | undefined;
  channel: CommunicationChannel;
};

const CHANNEL_DEFAULTS: Record<CommunicationChannel, { label: string; placeholder: string }> = {
  EMAIL: { label: 'Order Email', placeholder: 'Select an order email' },
  PHONE: { label: 'Order Phone', placeholder: 'Select an order phone' },
};

// Pre-configured Select over a party's communications tagged Ordering on one channel; inert until the party is known
export const PartyCommunicationSelector = forwardRef<HTMLButtonElement, PartyCommunicationSelectorProps>(
  ({ partyId, channel, params, ...props }, ref) => (
    <Select
      ref={ref}
      label={CHANNEL_DEFAULTS[channel].label}
      placeholder={partyId ? CHANNEL_DEFAULTS[channel].placeholder : 'Select a supplier first'}
      description="From the supplier's communications tagged Ordering"
      searchable
      {...props}
      disabled={!partyId || props.disabled}
      optionsEndpoint={partyId ? 'commerce-api/select-api/party-communications' : undefined}
      params={partyId ? { ...params, partyId, channel, function: 'ORDERING' } : undefined}
    />
  ),
);
PartyCommunicationSelector.displayName = 'PartyCommunicationSelector';
