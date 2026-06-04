import { useQuery } from '@tanstack/react-query';
import { majorToMinor } from '@vritti/quantum-ui/money';
import type { AxiosError } from 'axios';
import { useMemo } from 'react';
import type { CurrencyAmount, OfferingData, OfferingVariant } from '@/schemas/offerings';
import type { PosTerminalData } from '@/schemas/pos-terminals';
import { getOfferingsTable, listVariants } from '@/services/offerings.service';

export interface PosSellableItem {
  offeringId: string;
  name: string;
  categoryName: string | null;
  currencyCode: string;
  priceRange: { min: CurrencyAmount; max: CurrencyAmount } | null;
  variantCount: number;
  modifierGroupCount: number;
  // The lone available variant, present only when variantCount === 1
  singleVariant?: OfferingVariant;
}

interface UseTerminalSellablesResult {
  items: PosSellableItem[];
  catalogId: string | null;
  catalogMissing: boolean;
  isLoading: boolean;
  error: AxiosError | null;
}

interface SellablesData {
  offerings: OfferingData[];
  variantsByOffering: Record<string, OfferingVariant[]>;
}

// Lists the terminal's catalog offerings and their variants so each offering can be mapped
// to a single sellable tile with a price range and instant-add metadata.
async function fetchSellables(catalogId: string): Promise<SellablesData> {
  const table = await getOfferingsTable(catalogId);
  const offerings = table.result.filter((offering) => offering.isAvailable);
  const variantLists = await Promise.all(
    offerings.map((offering) => listVariants({ catalogId, offeringId: offering.id })),
  );
  const variantsByOffering: Record<string, OfferingVariant[]> = {};
  offerings.forEach((offering, index) => {
    variantsByOffering[offering.id] = variantLists[index];
  });
  return { offerings, variantsByOffering };
}

export function useTerminalSellables(terminal: PosTerminalData | undefined): UseTerminalSellablesResult {
  const catalogId = terminal?.catalogId ?? null;

  const query = useQuery<SellablesData, AxiosError>({
    queryKey: ['commerce', 'pos-sellables', catalogId],
    queryFn: () => fetchSellables(catalogId as string),
    enabled: !!catalogId,
  });

  const items = useMemo<PosSellableItem[]>(() => {
    if (!query.data) return [];
    const sellables: PosSellableItem[] = [];
    for (const offering of query.data.offerings) {
      const available = (query.data.variantsByOffering[offering.id] ?? []).filter((v) => v.isAvailable);
      if (available.length === 0) continue;

      let minVariant = available[0];
      let maxVariant = available[0];
      for (const variant of available) {
        if (
          BigInt(majorToMinor(variant.price.value, variant.price.currency)) <
          BigInt(majorToMinor(minVariant.price.value, minVariant.price.currency))
        ) {
          minVariant = variant;
        }
        if (
          BigInt(majorToMinor(variant.price.value, variant.price.currency)) >
          BigInt(majorToMinor(maxVariant.price.value, maxVariant.price.currency))
        ) {
          maxVariant = variant;
        }
      }

      sellables.push({
        offeringId: offering.id,
        name: offering.name,
        categoryName: offering.categoryName,
        currencyCode: offering.currencyCode,
        priceRange: { min: minVariant.price, max: maxVariant.price },
        variantCount: available.length,
        modifierGroupCount: offering.modifierGroupCount,
        singleVariant: available.length === 1 ? available[0] : undefined,
      });
    }
    return sellables;
  }, [query.data]);

  return {
    items,
    catalogId,
    catalogMissing: !terminal?.catalogId,
    isLoading: query.isLoading,
    error: query.error,
  };
}
