import { useMemo } from 'react';
import { usePriceListItems, useSavePriceListItems } from '@/hooks/price-lists';
import type { PriceListItemData, SavePriceListItemsData } from '@/schemas/price-lists';

interface PriceListItemAssignment {
  itemVariantId: string;
  sortOrder: number;
  isVisible: boolean;
  priceOverride: number | null;
}

const sortItems = (items: PriceListItemData[]) =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.itemName.localeCompare(b.itemName));

const toAssignments = (items: PriceListItemData[]): PriceListItemAssignment[] =>
  sortItems(items).map((item) => ({
    itemVariantId: item.itemVariantId,
    sortOrder: item.sortOrder,
    isVisible: item.isVisible,
    priceOverride: item.priceOverride ?? null,
  }));

const toSavePayload = (assignments: PriceListItemAssignment[]): SavePriceListItemsData => ({
  items: assignments.map((assignment, index) => ({
    itemVariantId: assignment.itemVariantId,
    sortOrder: assignment.sortOrder ?? index,
    isVisible: assignment.isVisible,
    priceOverride: assignment.priceOverride,
  })),
});

interface PriceListItemsState {
  orderedItems: PriceListItemData[];
  assignedItemIds: string[];
  isLoading: boolean;
  isSaving: boolean;
  error: ReturnType<typeof usePriceListItems>['error'];
  saveOverride: (target: PriceListItemData, priceOverride: number | null, isVisible: boolean) => void;
  removeItem: (target: PriceListItemData) => void;
}

// Owns the price-list items list, sort/assignment helpers, and save/remove mutations
export function usePriceListItemsState(priceListId: string): PriceListItemsState {
  const { data: items = [], isLoading, error } = usePriceListItems(priceListId);
  const saveMutation = useSavePriceListItems(priceListId);

  const orderedItems = useMemo(() => sortItems(items), [items]);
  const assignedItemIds = useMemo(() => orderedItems.map((item) => item.itemVariantId), [orderedItems]);

  const saveOverride = (target: PriceListItemData, priceOverride: number | null, isVisible: boolean) => {
    const next = toAssignments(orderedItems).map((assignment) =>
      assignment.itemVariantId === target.itemVariantId
        ? { ...assignment, priceOverride, isVisible }
        : assignment,
    );
    saveMutation.mutate(toSavePayload(next));
  };

  const removeItem = (target: PriceListItemData) => {
    const next = toAssignments(orderedItems).filter(
      (assignment) => assignment.itemVariantId !== target.itemVariantId,
    );
    saveMutation.mutate(toSavePayload(next));
  };

  return {
    orderedItems,
    assignedItemIds,
    isLoading,
    isSaving: saveMutation.isPending,
    error,
    saveOverride,
    removeItem,
  };
}
