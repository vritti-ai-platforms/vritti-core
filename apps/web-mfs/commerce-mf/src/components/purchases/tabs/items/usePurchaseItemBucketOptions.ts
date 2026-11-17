import { pluralize } from '@vritti/quantum-ui/pluralize';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { useMemo } from 'react';
import { type PurchaseItemBucket, purchaseItemBucketConfig } from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';

// The progress buckets an items table narrows to, each with how many of the purchase's items are in it
export function usePurchaseItemBucketOptions(binding: PurchasesBinding, purchaseId: string): SelectOption[] {
  const { data: facets } = binding.usePurchaseItemFacets(purchaseId);
  return useMemo(
    () =>
      (Object.keys(purchaseItemBucketConfig) as PurchaseItemBucket[]).map((bucket) => ({
        value: bucket,
        label: purchaseItemBucketConfig[bucket].label,
        description: facets ? pluralize('item', facets[bucket], true) : undefined,
      })),
    [facets],
  );
}
