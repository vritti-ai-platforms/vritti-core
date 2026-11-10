import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type ReceivablePurchaseOrderSelectorProps = Omit<SelectProps, 'optionsEndpoint'> & {
  supplierId: string | undefined;
  goodsReceiptId?: string;
};

// Pre-configured Select over the supplier's confirmed or partially received purchase orders with something left to
// receive; with a receipt, only those of its site not already on it. Inert until the supplier is known
export const ReceivablePurchaseOrderSelector = forwardRef<HTMLButtonElement, ReceivablePurchaseOrderSelectorProps>(
  ({ supplierId, goodsReceiptId, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Purchase Order"
      placeholder={supplierId ? 'Select purchase order' : 'Select a supplier first'}
      searchable
      fieldKeys={{ valueKey: 'id', labelKey: 'poNumber' }}
      {...props}
      disabled={!supplierId || props.disabled}
      optionsEndpoint={supplierId ? 'commerce-api/select-api/receivable-purchase-orders' : undefined}
      params={supplierId ? { ...params, supplierId, ...(goodsReceiptId ? { goodsReceiptId } : {}) } : undefined}
    />
  ),
);
ReceivablePurchaseOrderSelector.displayName = 'ReceivablePurchaseOrderSelector';
