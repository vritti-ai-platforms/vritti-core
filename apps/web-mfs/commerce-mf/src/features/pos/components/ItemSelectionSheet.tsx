import { cn } from '@vritti/quantum-ui';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { majorToMinor, minorToMajor } from '@vritti/quantum-ui/money';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Minus, Plus } from 'lucide-react';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useOffering, useOfferingModifiers } from '@/hooks/offerings';
import type { CurrencyAmount, ModifierOptionData, OfferingModifierGroup, OfferingVariant } from '@/schemas/offerings';
import type { CartLineData, CartLineModifier } from './CartLine';

interface SheetOffering {
  id: string;
  name: string;
  currencyCode: string;
}

interface ItemSelectionSheetProps {
  catalogId: string;
  offering: SheetOffering | null;
  open: boolean;
  onClose: () => void;
  onAdd: (line: Omit<CartLineData, 'lineId'>) => void;
}

export const ItemSelectionSheet = ({ catalogId, offering, open, onClose, onAdd }: ItemSelectionSheetProps) => {
  const handle = useDialog({ onClose });
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      handle.open();
      wasOpenRef.current = true;
    } else if (!open && wasOpenRef.current) {
      wasOpenRef.current = false;
    }
  }, [open, handle]);

  return (
    <Dialog
      handle={handle}
      title={offering?.name}
      description="Choose options and add-ons"
      className="max-w-lg"
      content={(close) =>
        offering ? (
          <Suspense fallback={<SheetSkeleton />}>
            <SheetBody
              catalogId={catalogId}
              offering={offering}
              onAdd={(line) => {
                onAdd(line);
                close();
              }}
            />
          </Suspense>
        ) : null
      }
    />
  );
};

const SheetSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full rounded-md" />
    <Skeleton className="h-24 w-full rounded-md" />
    <Skeleton className="h-12 w-full rounded-md" />
  </div>
);

interface SheetBodyProps {
  catalogId: string;
  offering: SheetOffering;
  onAdd: (line: Omit<CartLineData, 'lineId'>) => void;
}

// Returns true when both arrays contain exactly the same ids regardless of order
function sameIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sorted = [...b].sort();
  return [...a].sort().every((id, i) => id === sorted[i]);
}

const SheetBody = ({ catalogId, offering, onAdd }: SheetBodyProps) => {
  const fmt = useFormatters();
  const { currencyCode } = offering;
  const { data: detail } = useOffering(catalogId, offering.id);
  const { data: modifierGroups } = useOfferingModifiers(catalogId, offering.id);

  const [optionSelections, setOptionSelections] = useState<Record<string, string>>({});
  const [modifierSelections, setModifierSelections] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  const hasAxes = detail.options.length > 0;

  // Preselect default modifier options once the groups load
  useEffect(() => {
    if (!modifierGroups) return;
    const initial: Record<string, string[]> = {};
    for (const group of modifierGroups) {
      const defaults = group.options.filter((o) => o.isDefault && o.isAvailable).map((o) => o.id);
      initial[group.id] = group.selectionType === 'SINGLE' ? defaults.slice(0, 1) : defaults;
    }
    setModifierSelections(initial);
  }, [modifierGroups]);

  const selectedVariant = useMemo<OfferingVariant | null>(() => {
    if (!hasAxes) {
      return detail.variants.find((v) => v.isAvailable) ?? detail.variants[0] ?? null;
    }
    const chosen = detail.options.map((option) => optionSelections[option.id]).filter(Boolean) as string[];
    if (chosen.length !== detail.options.length) return null;
    return detail.variants.find((v) => sameIdSet(v.optionValueIds, chosen)) ?? null;
  }, [hasAxes, detail.options, detail.variants, optionSelections]);

  const selectedModifiers = useMemo<{ group: OfferingModifierGroup; option: ModifierOptionData }[]>(() => {
    if (!modifierGroups) return [];
    const result: { group: OfferingModifierGroup; option: ModifierOptionData }[] = [];
    for (const group of modifierGroups) {
      for (const optionId of modifierSelections[group.id] ?? []) {
        const option = group.options.find((o) => o.id === optionId);
        if (option) result.push({ group, option });
      }
    }
    return result;
  }, [modifierGroups, modifierSelections]);

  const modifierError = useMemo<string | null>(() => {
    if (!modifierGroups) return null;
    for (const group of modifierGroups) {
      const count = (modifierSelections[group.id] ?? []).length;
      if (count < group.minSelections) {
        return `Select at least ${group.minSelections} option${group.minSelections === 1 ? '' : 's'} for ${group.name}`;
      }
      if (group.maxSelections != null && count > group.maxSelections) {
        return `Select at most ${group.maxSelections} option${group.maxSelections === 1 ? '' : 's'} for ${group.name}`;
      }
    }
    return null;
  }, [modifierGroups, modifierSelections]);

  const unitMinor = useMemo<bigint | null>(() => {
    if (!selectedVariant) return null;
    let total = BigInt(majorToMinor(selectedVariant.price.value, selectedVariant.price.currency));
    for (const { option } of selectedModifiers) total += BigInt(option.additionalPrice);
    return total;
  }, [selectedVariant, selectedModifiers]);

  const lineTotal: CurrencyAmount | null = useMemo(() => {
    if (unitMinor == null) return null;
    return { currency: currencyCode, value: minorToMajor((unitMinor * BigInt(quantity)).toString(), currencyCode) };
  }, [unitMinor, quantity, currencyCode]);

  const canAdd = selectedVariant != null && modifierError == null;

  const toggleModifier = (group: OfferingModifierGroup, optionId: string) => {
    setModifierSelections((prev) => {
      const current = prev[group.id] ?? [];
      if (group.selectionType === 'SINGLE') {
        return { ...prev, [group.id]: current.includes(optionId) && group.minSelections === 0 ? [] : [optionId] };
      }
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
      return { ...prev, [group.id]: next };
    });
  };

  const handleAdd = () => {
    if (!selectedVariant) return;
    const modifiers: CartLineModifier[] = selectedModifiers.map(({ group, option }) => ({
      modifierGroupId: group.id,
      modifierOptionId: option.id,
      name: option.name,
      additionalPrice: option.additionalPrice,
    }));
    onAdd({
      offeringVariantId: selectedVariant.id,
      offeringName: offering.name,
      offeringVariantName: selectedVariant.name,
      unitPrice: selectedVariant.price,
      modifiers,
      quantity,
    });
  };

  return (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
      {selectedVariant ? (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
          <Typography variant="body2" intent="muted">
            Unit price
          </Typography>
          <Typography variant="h6" className="font-mono font-bold tabular-nums">
            {fmt.currency(selectedVariant.price).primary}
          </Typography>
        </div>
      ) : null}

      {hasAxes
        ? detail.options.map((option) => (
            <div key={option.id} className="space-y-2">
              <Typography variant="subtitle2">{option.name}</Typography>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const isActive = optionSelections[option.id] === value.id;
                  return (
                    <Button
                      key={value.id}
                      type="button"
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-full"
                      onClick={() => setOptionSelections((prev) => ({ ...prev, [option.id]: value.id }))}
                    >
                      {value.value}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))
        : null}

      {modifierGroups?.map((group) => (
        <div key={group.id} className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Typography variant="subtitle2">{group.name}</Typography>
            <Typography variant="caption" intent="muted">
              {group.selectionType === 'SINGLE'
                ? 'Pick one'
                : group.maxSelections != null
                  ? `Up to ${group.maxSelections}`
                  : 'Pick any'}
              {group.minSelections > 0 ? ' · required' : ''}
            </Typography>
          </div>
          <div className="flex flex-wrap gap-2">
            {group.options
              .filter((option) => option.isAvailable)
              .map((option) => {
                const isActive = (modifierSelections[group.id] ?? []).includes(option.id);
                const addOnMinor = BigInt(option.additionalPrice);
                return (
                  <Button
                    key={option.id}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className={cn('rounded-full', isActive && 'ring-1 ring-primary')}
                    onClick={() => toggleModifier(group, option.id)}
                  >
                    {option.name}
                    {addOnMinor > 0n ? (
                      <span className="ml-1.5 font-mono tabular-nums">
                        +
                        {
                          fmt.currency({
                            currency: currencyCode,
                            value: minorToMajor(option.additionalPrice, currencyCode),
                          }).primary
                        }
                      </span>
                    ) : null}
                  </Button>
                );
              })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <Typography variant="subtitle2">Quantity</Typography>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </Button>
          <Typography variant="subtitle1" className="w-10 text-center tabular-nums">
            {quantity}
          </Typography>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {modifierError ? (
        <Typography variant="caption" className="text-destructive">
          {modifierError}
        </Typography>
      ) : null}

      <Button
        type="button"
        className="w-full h-12 text-base"
        disabled={!canAdd}
        onClick={handleAdd}
        endAdornment={
          lineTotal ? <span className="font-mono tabular-nums">{fmt.currency(lineTotal).primary}</span> : undefined
        }
      >
        Add to cart
      </Button>
    </div>
  );
};
