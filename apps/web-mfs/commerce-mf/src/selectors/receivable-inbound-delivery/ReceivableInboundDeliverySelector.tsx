import { formatDate } from '@vritti/quantum-ui/format';
import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type ReceivableInboundDeliverySelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// The supplier, then the day the delivery is expected
function describeDelivery(supplierName: string, option: SelectOption): string {
  const expected = option.additionals?.expectedDeliveryDate;
  const expectedOn = typeof expected === 'string' ? `expected ${formatDate(expected).primary}` : '';
  return [supplierName, expectedOn].filter(Boolean).join(' · ');
}

// Pre-configured Select over the announced inbound deliveries still open, without a draft receipt and with something
// left to receive — the ones a goods receipt can be created from
export const ReceivableInboundDeliverySelector = forwardRef<HTMLButtonElement, ReceivableInboundDeliverySelectorProps>(
  (props, ref) => (
    <Select
      ref={ref}
      label="Inbound Delivery"
      placeholder="Select inbound delivery"
      searchable
      optionsEndpoint="commerce-api/select-api/receivable-inbound-deliveries"
      fieldKeys={{ valueKey: 'id', labelKey: 'deliveryNumber', descriptionKey: 'displayName' }}
      transformDescription={describeDelivery}
      {...props}
    />
  ),
);
ReceivableInboundDeliverySelector.displayName = 'ReceivableInboundDeliverySelector';
