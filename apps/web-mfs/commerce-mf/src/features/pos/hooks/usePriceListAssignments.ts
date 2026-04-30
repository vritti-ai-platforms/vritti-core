import { useMemo } from 'react';
import { useSaveTerminalPriceLists, useTerminalPriceLists } from '@/hooks/price-lists';
import type { SaveTerminalPriceListsData, TerminalPriceListData } from '@/schemas/price-lists';

interface AssignmentInput {
  priceListId: string;
  priority?: string;
  isDefault?: boolean;
}

const toAssignments = (priceLists: TerminalPriceListData[]): SaveTerminalPriceListsData['priceLists'] =>
  priceLists.map((priceList, index) => ({
    priceListId: priceList.priceListId,
    priority: Number.isFinite(priceList.priority) ? priceList.priority : index,
    isDefault: priceList.isDefault,
  }));

// Ensures only one assignment is marked default; clears the flag on others when a default is set
const normalizeDefault = (
  priceLists: SaveTerminalPriceListsData['priceLists'],
  defaultPriceListId: string | null,
): SaveTerminalPriceListsData['priceLists'] => {
  if (!defaultPriceListId) return priceLists;
  return priceLists.map((priceList) => ({
    ...priceList,
    isDefault: priceList.priceListId === defaultPriceListId,
  }));
};

interface UsePriceListAssignmentsResult {
  priceLists: TerminalPriceListData[];
  existingPriceListIds: string[];
  isLoading: boolean;
  isSaving: boolean;
  error: ReturnType<typeof useTerminalPriceLists>['error'];
  addAssignment: (values: AssignmentInput, onDone?: () => void) => void;
  updateAssignment: (existingPriceListId: string, values: AssignmentInput, onDone?: () => void) => void;
  removeAssignment: (priceListId: string) => void;
}

// Owns the terminal-to-price-list assignments query and mutations
export function usePriceListAssignments(terminalId: string): UsePriceListAssignmentsResult {
  const { data: priceLists = [], isLoading, error } = useTerminalPriceLists(terminalId);
  const saveMutation = useSaveTerminalPriceLists();

  const existingPriceListIds = useMemo(
    () => priceLists.map((priceList) => priceList.priceListId),
    [priceLists],
  );

  const persist = (next: SaveTerminalPriceListsData['priceLists'], onDone?: () => void) => {
    saveMutation.mutate({ terminalId, data: { priceLists: next } }, { onSuccess: () => onDone?.() });
  };

  const addAssignment = (values: AssignmentInput, onDone?: () => void) => {
    if (existingPriceListIds.includes(values.priceListId)) {
      onDone?.();
      return;
    }
    const base = toAssignments(priceLists);
    const next = [
      ...base,
      {
        priceListId: values.priceListId,
        priority: values.priority ? Number(values.priority) : base.length,
        isDefault: values.isDefault ?? false,
      },
    ];
    persist(normalizeDefault(next, values.isDefault ? values.priceListId : null), onDone);
  };

  const updateAssignment = (
    existingPriceListId: string,
    values: AssignmentInput,
    onDone?: () => void,
  ) => {
    const base = toAssignments(priceLists);
    const next = base.map((priceList) =>
      priceList.priceListId === existingPriceListId
        ? {
            priceListId: values.priceListId,
            priority: values.priority ? Number(values.priority) : priceList.priority,
            isDefault: values.isDefault ?? false,
          }
        : priceList,
    );
    persist(normalizeDefault(next, values.isDefault ? values.priceListId : null), onDone);
  };

  const removeAssignment = (priceListId: string) => {
    const next = toAssignments(priceLists).filter((row) => row.priceListId !== priceListId);
    persist(next);
  };

  return {
    priceLists,
    existingPriceListIds,
    isLoading,
    isSaving: saveMutation.isPending,
    error,
    addAssignment,
    updateAssignment,
    removeAssignment,
  };
}
