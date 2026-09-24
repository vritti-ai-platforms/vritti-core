import { formatCurrency } from '@vritti/quantum-ui/money';
import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type PurchaseOrderItemSelectorParams = {
  purchaseOrderId: string;
  excludeOnGoodsReceiptId?: string;
};

export type PurchaseOrderItemSelectorProps = Omit<SelectProps, 'optionsEndpoint' | 'params'> & {
  params: PurchaseOrderItemSelectorParams;
};

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'name',
  descriptionKey: 'tracking',
  groupIdKey: 'categoryId',
  additionalKeys: 'symbol,inventoryItemId,uomId,unitPrice,currencyCode,allowDecimal,orderedQuantity,receivedQuantity',
} as const;

function defaultTransformLabel(label: string, option: SelectOption): string {
  const baseLabel = label.replace(/\s-\s[^-]+$/, '');
  const uom = typeof option.additionals?.symbol === 'string' ? option.additionals.symbol.trim() : '';
  const rawPrice = option.additionals?.unitPrice;
  const currencyCode = typeof option.additionals?.currencyCode === 'string' ? option.additionals.currencyCode : null;
  const unitPrice = rawPrice != null && currencyCode != null ? formatCurrency(String(rawPrice), currencyCode) : null;
  if (unitPrice && uom) return `${baseLabel} - ${unitPrice}/${uom}`;
  if (unitPrice) return `${baseLabel} - ${unitPrice}`;
  if (uom) return `${baseLabel} (${uom})`;
  return baseLabel;
}

// Humanises the `inventory_items.tracking` enum that the backend serves as the option description.
function defaultTransformDescription(value: string): string {
  switch (value) {
    case 'quantity':
      return 'Quantity';
    case 'lot':
      return 'Lot';
    case 'serial':
      return 'Serial';
    case 'lot_serial':
      return 'Lot + Serial';
    default:
      return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export const PurchaseOrderItemSelector = forwardRef<HTMLButtonElement, PurchaseOrderItemSelectorProps>(
  ({ fieldKeys, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Purchase Order Item"
      placeholder="Select item from purchase order"
      searchable
      optionsEndpoint="commerce-api/select-api/purchase-order-items"
      params={params}
      transformLabel={defaultTransformLabel}
      transformDescription={defaultTransformDescription}
      {...props}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
PurchaseOrderItemSelector.displayName = 'PurchaseOrderItemSelector';
