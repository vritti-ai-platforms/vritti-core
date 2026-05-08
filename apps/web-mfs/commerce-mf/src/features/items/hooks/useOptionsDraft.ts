import { useEffect, useState } from 'react';
import { useGenerateVariants } from '@/hooks/items';
import { useSaveItemOptions } from '@/hooks/items';
import type { ItemDetail, OptionInput } from '@/schemas/items';

export interface OptionDraft {
  name: string;
  values: string[];
}

const toDraft = (item: ItemDetail): OptionDraft[] =>
  item.options.map((option) => ({ name: option.name, values: option.values.map((v) => v.value) }));

const sortedValues = (values: string[]) => [...values].sort();

interface UseOptionsDraftResult {
  options: OptionDraft[];
  addOption: () => void;
  removeOption: (index: number) => void;
  updateName: (index: number, name: string) => void;
  addValue: (index: number, value: string) => void;
  removeValue: (optionIndex: number, valueIndex: number) => void;
  previewVariantCount: number;
  isDirty: boolean;
  applyOptions: () => void;
  discardOptions: () => void;
  isApplying: boolean;
}

// Manages local draft state for an item's options + chains save+regenerate on apply
export function useOptionsDraft(item: ItemDetail): UseOptionsDraftResult {
  const [options, setOptions] = useState<OptionDraft[]>(() => toDraft(item));

  // Reset local draft whenever the server options change (after a successful apply)
  useEffect(() => {
    setOptions(toDraft(item));
  }, [item.options]);

  const generateMutation = useGenerateVariants();
  const saveOptionsMutation = useSaveItemOptions({
    onSuccess: () => generateMutation.mutate(item.id),
  });

  const validOptions = options.filter((o) => o.name.trim() && o.values.length > 0);
  const previewVariantCount = validOptions.length === 0 ? 0 : validOptions.reduce((acc, o) => acc * o.values.length, 1);

  const serverShape = item.options.map((o) => ({ name: o.name, values: sortedValues(o.values.map((v) => v.value)) }));
  const localShape = validOptions.map((o) => ({ name: o.name.trim(), values: sortedValues(o.values) }));
  const isDirty = JSON.stringify(serverShape) !== JSON.stringify(localShape);

  const addOption = () => setOptions((prev) => [...prev, { name: '', values: [] }]);
  const removeOption = (index: number) => setOptions((prev) => prev.filter((_, i) => i !== index));
  const updateName = (index: number, name: string) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, name } : o)));

  const addValue = (index: number, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setOptions((prev) =>
      prev.map((o, i) => (i === index && !o.values.includes(trimmed) ? { ...o, values: [...o.values, trimmed] } : o)),
    );
  };

  const removeValue = (optionIndex: number, valueIndex: number) =>
    setOptions((prev) =>
      prev.map((o, i) => (i === optionIndex ? { ...o, values: o.values.filter((_, j) => j !== valueIndex) } : o)),
    );

  const applyOptions = () => {
    const payload: OptionInput[] = validOptions.map((o) => ({
      name: o.name.trim(),
      values: o.values.map((v) => ({ value: v })),
    }));
    saveOptionsMutation.mutate({ id: item.id, data: { options: payload } });
  };

  const discardOptions = () => setOptions(toDraft(item));

  return {
    options,
    addOption,
    removeOption,
    updateName,
    addValue,
    removeValue,
    previewVariantCount,
    isDirty,
    applyOptions,
    discardOptions,
    isApplying: saveOptionsMutation.isPending || generateMutation.isPending,
  };
}
