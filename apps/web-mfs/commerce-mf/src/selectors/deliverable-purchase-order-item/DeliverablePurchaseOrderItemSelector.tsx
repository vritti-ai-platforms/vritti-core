import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type DeliverablePurchaseOrderItemSelectorParams = {
  inboundDeliveryId: string;
};

export type DeliverablePurchaseOrderItemSelectorProps = Omit<SelectProps, 'optionsEndpoint' | 'params'> & {
  params: DeliverablePurchaseOrderItemSelectorParams;
};

// Suffixes the item name with the unit the line is ordered in
function transformLabel(label: string, option: SelectOption): string {
  const uomSymbol = typeof option.additionals?.uomSymbol === 'string' ? option.additionals.uomSymbol.trim() : '';
  return uomSymbol ? `${label} (${uomSymbol})` : label;
}

// The open lines of the delivery's supplier's purchase orders at its site that still have something left to deliver
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
