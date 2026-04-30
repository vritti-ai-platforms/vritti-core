import { useConfirm } from '@vritti/quantum-ui/hooks';
import { useEffect, useState } from 'react';
import { useBatchUpdateVariants } from '@/hooks/useBatchUpdateVariants';
import { useDeleteVariant } from '@/hooks/useDeleteVariant';
import type { ItemDetail, ItemVariant } from '@/schemas/items';

export interface VariantEditState {
  price: string;
  isAvailable: boolean;
}

const toEditMap = (item: ItemDetail): Map<string, VariantEditState> => {
  const map = new Map<string, VariantEditState>();
  for (const v of item.variants) {
    map.set(v.id, { price: v.price ?? '', isAvailable: v.isAvailable });
  }
  return map;
};

interface UseVariantEditsResult {
  edits: Map<string, VariantEditState>;
  dirtyIds: Set<string>;
  isDirty: boolean;
  updateField: (variantId: string, field: keyof VariantEditState, value: string | boolean) => void;
  saveChanges: () => void;
  discardChanges: () => void;
  deleteVariant: (variant: ItemVariant) => Promise<void>;
  isSaving: boolean;
}

// Manages local edits to variant rows (price, availability) and per-row delete
export function useVariantEdits(item: ItemDetail): UseVariantEditsResult {
  const confirm = useConfirm();
  const [edits, setEdits] = useState<Map<string, VariantEditState>>(() => toEditMap(item));

  // Reset local edits when the server variants list changes
  useEffect(() => {
    setEdits(toEditMap(item));
  }, [item.variants]);

  const batchUpdateMutation = useBatchUpdateVariants();
  const deleteVariantMutation = useDeleteVariant();

  const dirtyIds = new Set<string>();
  for (const variant of item.variants) {
    const edit = edits.get(variant.id);
    if (!edit) continue;
    if (edit.price !== (variant.price ?? '') || edit.isAvailable !== variant.isAvailable) {
      dirtyIds.add(variant.id);
    }
  }

  const updateField = (variantId: string, field: keyof VariantEditState, value: string | boolean) => {
    setEdits((prev) => {
      const next = new Map(prev);
      const current = next.get(variantId);
      if (current) next.set(variantId, { ...current, [field]: value });
      return next;
    });
  };

  const saveChanges = () => {
    const updates = Array.from(dirtyIds).map((variantId) => {
      const edit = edits.get(variantId)!;
      return {
        variantId,
        data: { price: edit.price ? Number(edit.price) : null, isAvailable: edit.isAvailable },
      };
    });
    batchUpdateMutation.mutate({ itemId: item.id, updates });
  };

  const discardChanges = () => setEdits(toEditMap(item));

  const deleteVariant = async (variant: ItemVariant) => {
    const confirmed = await confirm({
      title: `Delete variant "${variant.name}"?`,
      description: 'This variant will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteVariantMutation.mutate({ itemId: item.id, variantId: variant.id });
  };

  return {
    edits,
    dirtyIds,
    isDirty: dirtyIds.size > 0,
    updateField,
    saveChanges,
    discardChanges,
    deleteVariant,
    isSaving: batchUpdateMutation.isPending,
  };
}
