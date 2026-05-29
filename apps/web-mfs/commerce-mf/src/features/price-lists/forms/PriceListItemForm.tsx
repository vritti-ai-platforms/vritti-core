import { Button } from '@vritti/quantum-ui/Button';
import { MultiSelect, type MultiSelectProps } from '@vritti/quantum-ui/Select';
import type React from 'react';
import { useState } from 'react';
import { usePriceListItems, useSavePriceListItems, useSearchItemVariantsForPriceList } from '@/hooks/price-lists';
import type { PriceListItemData } from '@/schemas/price-lists';

interface PriceListItemFormProps {
  priceListId: string;
  excludeItemIds?: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

const AddPriceListItemsForm: React.FC<{
  priceListId: string;
  excludeItemIds: string[];
  currentItems: PriceListItemData[];
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ priceListId, excludeItemIds, currentItems, onSuccess, onCancel }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const saveMutation = useSavePriceListItems(priceListId, { onSuccess });

  const { data: optionsResponse, isLoading } = useSearchItemVariantsForPriceList(search || undefined);

  const options = (optionsResponse?.options ?? []).filter((opt) => !excludeItemIds.includes(String(opt.value)));

  const asyncState: MultiSelectProps['asyncState'] = {
    loading: isLoading,
    loadingMore: false,
    hasMore: optionsResponse?.hasMore ?? false,
    searchQuery: search,
    setSearchQuery: setSearch,
    sentinelRef: () => undefined,
  };

  const handleSave = () => {
    if (selectedIds.length === 0) return;
    // Narrow `priceOverride` (string from API) to `number` for the save payload (form-state shape).
    const existing = currentItems.map((it) => ({
      itemVariantId: it.itemVariantId,
      sortOrder: it.sortOrder,
      isVisible: it.isVisible,
      priceOverride: it.priceOverride != null ? Number(it.priceOverride) : null,
    }));
    const added = selectedIds.map((id, i) => ({
      itemVariantId: id,
      sortOrder: currentItems.length + i,
      isVisible: true,
      priceOverride: null,
    }));
    saveMutation.mutate({ items: [...existing, ...added] });
  };

  return (
    <div className="space-y-4">
      <MultiSelect
        label="Items"
        placeholder="Search and select items"
        options={options}
        value={selectedIds}
        onChange={(vals) => setSelectedIds(vals.map(String))}
        asyncState={asyncState}
        searchable
        searchPlaceholder="Search items..."
      />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={selectedIds.length === 0 || saveMutation.isPending}
          isLoading={saveMutation.isPending}
        >
          {selectedIds.length > 1 ? `Add ${selectedIds.length} Items` : 'Add Item'}
        </Button>
      </div>
    </div>
  );
};

export const PriceListItemForm: React.FC<PriceListItemFormProps> = ({
  priceListId,
  excludeItemIds = [],
  onSuccess,
  onCancel,
}) => {
  const { data: currentItems = [] } = usePriceListItems(priceListId);

  return (
    <AddPriceListItemsForm
      priceListId={priceListId}
      excludeItemIds={[...excludeItemIds, ...currentItems.map((it) => it.itemVariantId)]}
      currentItems={currentItems}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
};
