import { useMutation } from '@apollo/client/react';
import { UPDATE_UOM_CONVERSION } from '../../../graphql/uom-conversions';

// UPDATE — the mutation returns success only, so patch the normalized entity directly: set the new ratio
// and recompute the derived factors client-side (toPrimary = primaryUomQty/uomQty, toUom = uomQty/primaryUomQty).
// No refetch; every view holding this conversion updates by id.
export function useUpdateUomConversion() {
  return useMutation(UPDATE_UOM_CONVERSION, {
    update(cache, _result, { variables }) {
      if (!variables) return;
      const { id, input } = variables;
      const { primaryUomQty, uomQty } = input;
      cache.modify({
        id: cache.identify({ __typename: 'InventoryItemUomConversion', id }),
        fields: {
          primaryUomQty: () => primaryUomQty,
          uomQty: () => uomQty,
          toPrimaryConversionFactor: () => primaryUomQty / uomQty,
          toUomConversionFactor: () => uomQty / primaryUomQty,
        },
      });
    },
  });
}
