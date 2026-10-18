import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card } from '@vritti/quantum-ui/Card';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { Typography } from '@vritti/quantum-ui/Typography';
import { X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Controller, type UseFormReturn, useFieldArray, useWatch } from 'react-hook-form';
import type { CatalogListingPricesFormShape } from '@/schemas/catalogs';
import { InventoryItemMrpSelector } from '@/selectors/inventory-item-mrp';
import { useAddListingsWizard } from './AddListingsProvider';

interface ListingVariantCardProps {
  form: UseFormReturn<CatalogListingPricesFormShape>;
  index: number;
  offeringVariantId: string;
  code: string;
  facets?: string;
  onRemove: () => void;
}

const ANY_BATCH = 'Any batch';

// One variant's card — picking no MRP is itself an answer, so there is always at least one price slot
export const ListingVariantCard: React.FC<ListingVariantCardProps> = ({
  form,
  index,
  offeringVariantId,
  code,
  facets,
  onRemove,
}) => {
  const { catalogId, currencyCode } = useAddListingsWizard();
  const { control, getValues } = form;
  const rows = useFieldArray({ control, name: `variants.${index}.rows` });
  const mrpIds = useWatch({ control, name: `variants.${index}.mrpIds` }) ?? [];
  // The selector hands back whole options, which is the only place the amount and pack unit are spelled out
  const [mrpLabels, setMrpLabels] = useState<Record<string, string>>({});
  const key = mrpIds.join('|');

  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the MRP ids, not the array identity
  useEffect(() => {
    const current = getValues(`variants.${index}.rows`) ?? [];
    const next =
      mrpIds.length === 0
        ? [{ inventoryItemMrpId: null }]
        : mrpIds.map(
            (id) => current.find((row) => row.inventoryItemMrpId === id) ?? { inventoryItemMrpId: id as string | null },
          );
    // Only when the MRPs themselves changed — rebuilding on every keystroke would throw away the price being typed
    const unchanged =
      next.length === current.length &&
      next.every((row, position) => row.inventoryItemMrpId === current[position]?.inventoryItemMrpId);
    if (!unchanged) rows.replace(next);
  }, [key, index]);

  // Merged, never replaced — a price row still needs the amount its MRP was labelled with after a search
  const handleMrpOptions = (options: SelectOption[]) =>
    setMrpLabels((previous) => ({
      ...previous,
      ...Object.fromEntries(options.map((option) => [String(option.value), option.label])),
    }));

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="flex min-w-0 flex-col">
          {/* The values that tell this variant from its siblings, loudest. Its name is the offering's plus
              them, and the offering is the same on every card here — repeating it reads as noise. */}
          <Typography variant="body2" className="truncate font-medium">
            {facets || code}
          </Typography>
          <Typography variant="caption" intent="muted" className="truncate font-mono">
            {code}
          </Typography>
        </div>
        <span className="flex-1" />
        <Badge variant="outline">{pluralize('listing', rows.fields.length, true)}</Badge>
        <Button type="button" variant="ghost" size="icon" className="size-7" onClick={onRemove} aria-label="Remove">
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <Controller
          control={control}
          name={`variants.${index}.mrpIds`}
          render={({ field, fieldState }) => (
            <InventoryItemMrpSelector
              multiple
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              variantId={offeringVariantId}
              currencyCode={currencyCode}
              catalogId={catalogId}
              onOptionsSelect={handleMrpOptions}
              description="Leave empty to list this variant for any batch. Pick MRPs to list it once per printed price."
            />
          )}
        />

        <div className="flex flex-col gap-2">
          <Typography variant="body2" className="font-medium">
            {pluralize('Price', rows.fields.length)}
          </Typography>
          {rows.fields.map((field, position) => {
            const mrpId = field.inventoryItemMrpId;
            return (
              <div key={field.id} className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
                <div className="flex min-w-0 flex-col">
                  <Typography variant="body2" className="truncate font-mono">
                    {mrpId ? (mrpLabels[mrpId] ?? 'Selected MRP') : ANY_BATCH}
                  </Typography>
                  <Typography variant="caption" intent="muted">
                    {mrpId ? 'Cannot be priced above it' : 'No printed ceiling'}
                  </Typography>
                </div>
                <Controller
                  control={control}
                  name={`variants.${index}.rows.${position}.price`}
                  render={({ field: priceField, fieldState }) => (
                    <CurrencyField
                      value={priceField.value}
                      onChange={priceField.onChange}
                      error={fieldState.error?.message}
                      currencyCode={currencyCode}
                      disabled={!currencyCode}
                      disabledTip="This catalog carries no currency yet. Add one on the Prices tab."
                      placeholder="Optional"
                    />
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
