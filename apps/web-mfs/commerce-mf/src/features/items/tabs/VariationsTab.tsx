import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { TextField } from '@vritti/quantum-ui/TextField';
import { cn } from '@vritti/quantum-ui';
import { Layers, Plus, Trash2, X } from 'lucide-react';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBatchUpdateVariants } from '@/hooks/useBatchUpdateVariants';
import { useDeleteVariant } from '@/hooks/useDeleteVariant';
import { useGenerateVariants } from '@/hooks/useGenerateVariants';
import { useSaveItemOptions } from '@/hooks/useSaveItemOptions';
import type { ItemDetail, ItemVariant, OptionInput } from '@/schemas/items';

interface VariationsTabProps {
  item: ItemDetail;
}

interface OptionEditorState {
  name: string;
  values: string[];
}

export const VariationsTab: React.FC<VariationsTabProps> = ({ item }) => {
  // Initialize editor state from existing options
  const [options, setOptions] = useState<OptionEditorState[]>(() =>
    item.options.map((o) => ({
      name: o.name,
      values: o.values.map((v) => v.value),
    })),
  );
  const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({});
  const [showRegenerateNotice, setShowRegenerateNotice] = useState(false);

  // Batch variant editing state
  const [variantEdits, setVariantEdits] = useState<Map<string, { price: string; costPrice: string; isAvailable: boolean }>>(() => {
    const map = new Map();
    for (const v of item.variants) {
      map.set(v.id, { price: v.price ?? '', costPrice: v.costPrice ?? '', isAvailable: v.isAvailable });
    }
    return map;
  });

  // Re-initialize variant edits when item.variants changes (after refetch)
  useEffect(() => {
    const map = new Map();
    for (const v of item.variants) {
      map.set(v.id, { price: v.price ?? '', costPrice: v.costPrice ?? '', isAvailable: v.isAvailable });
    }
    setVariantEdits(map);
  }, [item.variants]);

  const saveOptionsMutation = useSaveItemOptions({
    onSuccess: () => setShowRegenerateNotice(true),
  });
  const generateVariantsMutation = useGenerateVariants();
  const batchUpdateMutation = useBatchUpdateVariants();
  const deleteVariantMutation = useDeleteVariant();
  const confirm = useConfirm();

  // Computes whether local options differ from server options
  const isOptionsDirty = useMemo(() => {
    const serverOptions = item.options.map((o) => ({
      name: o.name,
      values: o.values.map((v) => v.value).sort(),
    }));
    const localOptions = options
      .filter((o) => o.name.trim() && o.values.length > 0)
      .map((o) => ({ name: o.name.trim(), values: [...o.values].sort() }));
    return JSON.stringify(serverOptions) !== JSON.stringify(localOptions);
  }, [options, item.options]);

  // Computes which variants have been edited
  const dirtyVariantIds = useMemo(() => {
    const dirty = new Set<string>();
    for (const variant of item.variants) {
      const edit = variantEdits.get(variant.id);
      if (!edit) continue;
      if (
        edit.price !== (variant.price ?? '') ||
        edit.costPrice !== (variant.costPrice ?? '') ||
        edit.isAvailable !== variant.isAvailable
      ) {
        dirty.add(variant.id);
      }
    }
    return dirty;
  }, [item.variants, variantEdits]);

  // Adds a new empty option row
  const handleAddOption = useCallback(() => {
    setOptions((prev) => [...prev, { name: '', values: [] }]);
  }, []);

  // Removes an option row by index
  const handleRemoveOption = useCallback((index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Updates an option name
  const handleOptionNameChange = useCallback((index: number, name: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, name } : o)));
  }, []);

  // Adds a value to an option when Enter is pressed
  const handleAddValue = useCallback((optionIndex: number, value: string) => {
    if (!value.trim()) return;
    setOptions((prev) =>
      prev.map((o, i) =>
        i === optionIndex && !o.values.includes(value.trim())
          ? { ...o, values: [...o.values, value.trim()] }
          : o,
      ),
    );
    setNewValueInputs((prev) => ({ ...prev, [optionIndex]: '' }));
  }, []);

  // Removes a value from an option
  const handleRemoveValue = useCallback((optionIndex: number, valueIndex: number) => {
    setOptions((prev) =>
      prev.map((o, i) =>
        i === optionIndex ? { ...o, values: o.values.filter((_, vi) => vi !== valueIndex) } : o,
      ),
    );
  }, []);

  // Saves options to the API
  const handleSaveOptions = useCallback(() => {
    const payload: OptionInput[] = options
      .filter((o) => o.name.trim() && o.values.length > 0)
      .map((o) => ({
        name: o.name.trim(),
        values: o.values.map((v) => ({ value: v })),
      }));
    saveOptionsMutation.mutate({ id: item.id, data: { options: payload } });
  }, [options, item.id, saveOptionsMutation]);

  // Generates variants from current options
  const handleGenerateVariants = useCallback(() => {
    generateVariantsMutation.mutate(item.id);
    setShowRegenerateNotice(false);
  }, [item.id, generateVariantsMutation]);

  // Updates a single variant field in local state
  const handleEditChange = useCallback((variantId: string, field: string, value: string | boolean) => {
    setVariantEdits((prev) => {
      const next = new Map(prev);
      const current = next.get(variantId);
      if (current) {
        next.set(variantId, { ...current, [field]: value });
      }
      return next;
    });
  }, []);

  // Batch saves all dirty variants
  const handleSaveAllVariants = useCallback(() => {
    const updates = [];
    for (const variantId of dirtyVariantIds) {
      const edit = variantEdits.get(variantId);
      if (!edit) continue;
      updates.push({
        variantId,
        data: {
          price: edit.price ? Number(edit.price) : null,
          costPrice: edit.costPrice ? Number(edit.costPrice) : null,
          isAvailable: edit.isAvailable,
        },
      });
    }
    batchUpdateMutation.mutate({ itemId: item.id, updates });
  }, [item.id, dirtyVariantIds, variantEdits, batchUpdateMutation]);

  // Confirms and deletes a single variant
  const handleDeleteVariant = useCallback(async (variant: ItemVariant) => {
    const confirmed = await confirm({
      title: `Delete variant "${variant.name}"?`,
      description: 'This variant will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteVariantMutation.mutate({ itemId: item.id, variantId: variant.id });
    }
  }, [confirm, deleteVariantMutation, item.id]);

  const hasOptions = options.some((o) => o.name.trim() && o.values.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Options</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Define option categories and their values. Save options first, then generate variants.
            </p>
          </div>
          <Button variant="outline" size="sm" startAdornment={<Plus className="size-4" />} onClick={handleAddOption}>
            Add Option
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {options.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No options defined. Add options like Size or Color to create variations.
            </p>
          )}
          {options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <TextField
                  placeholder="Option name (e.g. Size)"
                  value={option.name}
                  onChange={(e) => handleOptionNameChange(optionIndex, e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveOption(optionIndex)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value, valueIndex) => (
                  <Badge key={valueIndex} variant="secondary" className="flex items-center gap-1 py-1">
                    {value}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-4 p-0"
                      onClick={() => handleRemoveValue(optionIndex, valueIndex)}
                    >
                      <X className="size-3" />
                    </Button>
                  </Badge>
                ))}
                <TextField
                  placeholder="Add value + Enter"
                  value={newValueInputs[optionIndex] ?? ''}
                  onChange={(e) =>
                    setNewValueInputs((prev) => ({ ...prev, [optionIndex]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddValue(optionIndex, newValueInputs[optionIndex] ?? '');
                    }
                  }}
                  className="min-w-32"
                />
              </div>
            </div>
          ))}
          {options.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveOptions}
                disabled={saveOptionsMutation.isPending}
              >
                {saveOptionsMutation.isPending ? <Spinner className="size-4" /> : 'Save Options'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showRegenerateNotice && item.variants.length > 0 && (
        <Alert
          variant="warning"
          title="Options Updated"
          description="Previous variants were removed. Click 'Generate Variants' to recreate them with the new options."
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Variants</CardTitle>
          <div className="flex items-center gap-2">
            {dirtyVariantIds.size > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveAllVariants}
                disabled={batchUpdateMutation.isPending}
              >
                {batchUpdateMutation.isPending ? <Spinner className="size-4" /> : `Save ${dirtyVariantIds.size} changes`}
              </Button>
            )}
            {hasOptions && (
              <Button
                variant="outline"
                size="sm"
                startAdornment={<Layers className="size-4" />}
                onClick={handleGenerateVariants}
                disabled={isOptionsDirty || generateVariantsMutation.isPending}
              >
                {generateVariantsMutation.isPending ? (
                  <Spinner className="size-4" />
                ) : isOptionsDirty ? (
                  'Save options first'
                ) : (
                  'Generate Variants'
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {item.variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No variants yet. Add options above and generate variants.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">SKU</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Name</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Price</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Cost</th>
                    <th className="pb-2 font-medium text-muted-foreground">Available</th>
                    <th className="pb-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {item.variants.map((variant) => {
                    const edit = variantEdits.get(variant.id);
                    if (!edit) return null;
                    return (
                      <VariantRow
                        key={variant.id}
                        variant={variant}
                        edit={edit}
                        isDirty={dirtyVariantIds.has(variant.id)}
                        onEditChange={handleEditChange}
                        onDelete={handleDeleteVariant}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Renders a single variant row with controlled inputs
const VariantRow: React.FC<{
  variant: ItemVariant;
  edit: { price: string; costPrice: string; isAvailable: boolean };
  isDirty: boolean;
  onEditChange: (variantId: string, field: string, value: string | boolean) => void;
  onDelete: (variant: ItemVariant) => void;
}> = ({ variant, edit, isDirty, onEditChange, onDelete }) => (
  <tr className={cn('border-b last:border-0', isDirty && 'bg-warning/5')}>
    <td className="py-2 pr-4">
      <span className="font-mono text-xs">{variant.sku}</span>
    </td>
    <td className="py-2 pr-4">{variant.name}</td>
    <td className="py-2 pr-4">
      <TextField
        type="number"
        className="w-24"
        value={edit.price}
        onChange={(e) => onEditChange(variant.id, 'price', e.target.value)}
      />
    </td>
    <td className="py-2 pr-4">
      <TextField
        type="number"
        className="w-24"
        value={edit.costPrice}
        onChange={(e) => onEditChange(variant.id, 'costPrice', e.target.value)}
      />
    </td>
    <td className="py-2">
      <Badge
        variant={edit.isAvailable ? 'secondary' : 'outline'}
        className={cn('cursor-pointer', edit.isAvailable && 'bg-success/15 text-success')}
        onClick={() => onEditChange(variant.id, 'isAvailable', !edit.isAvailable)}
      >
        {edit.isAvailable ? 'Yes' : 'No'}
      </Badge>
    </td>
    <td className="py-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-destructive hover:text-destructive"
        onClick={() => onDelete(variant)}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </td>
  </tr>
);
