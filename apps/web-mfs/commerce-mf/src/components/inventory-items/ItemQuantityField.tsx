import { QuantityField, type QuantityFieldProps } from '@vritti/quantum-ui/QuantityField';
import { forwardRef, useMemo } from 'react';
import { useInventoryItemUnits } from '@/hooks/organization/inventory-items';

export type ItemQuantityFieldProps = Omit<
  QuantityFieldProps,
  'units' | 'primaryUnitId' | 'defaultUnitId' | 'loading'
> & {
  inventoryItemId: string | undefined;
};

// QuantityField fed with an inventory item's units from the API, starting in its display unit; another item starts the
// field over
export const ItemQuantityField = forwardRef<HTMLInputElement, ItemQuantityFieldProps>(
  ({ inventoryItemId, disabled, ...props }, ref) => {
    const { data, isLoading } = useInventoryItemUnits(inventoryItemId);
    const units = useMemo(
      () =>
        (data?.units ?? []).map((unit) => ({
          id: unit.uomId,
          name: unit.name,
          symbol: unit.symbol,
          primaryUomQty: unit.primaryUomQty,
          uomQty: unit.uomQty,
        })),
      [data],
    );
    return (
      <QuantityField
        key={inventoryItemId}
        ref={ref}
        {...props}
        units={units}
        primaryUnitId={data?.primaryUomId ?? ''}
        defaultUnitId={data?.displayUomId}
        loading={isLoading}
        disabled={disabled || !inventoryItemId}
      />
    );
  },
);
ItemQuantityField.displayName = 'ItemQuantityField';
