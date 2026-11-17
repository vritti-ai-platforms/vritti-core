import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type DeliverablePurchaseOrderItemSelectorParams = {
  inboundDeliveryId: string;
};

export type DeliverablePurchaseOrderItemSelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint' | 'params'> & {
  params: DeliverablePurchaseOrderItemSelectorParams;
};

// Suffixes the item name with the unit the line is ordered in
function transformLabel(label: string, option: SelectOption): string {
  const uomSymbol = typeof option.additionals?.uomSymbol === 'string' ? option.additionals.uomSymbol.trim() : '';
  return uomSymbol ? `${label} (${uomSymbol})` : label;
}

// The lines of the delivery's supplier's confirmed, not fully received purchase orders at its site with something left
// to deliver
export const DeliverablePurchaseOrderItemSelector = forwardRef<
  HTMLButtonElement,
  DeliverablePurchaseOrderItemSelectorProps
>((props, ref) => (
  <Select
    ref={ref}
    label="Purchase Order Lines"
    placeholder="Select open purchase order lines"
    searchable
    optionsEndpoint="commerce-api/select-api/deliverable-purchase-order-items"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'poNumber' }}
    transformLabel={transformLabel}
    {...props}
  />
));
DeliverablePurchaseOrderItemSelector.displayName = 'DeliverablePurchaseOrderItemSelector';
