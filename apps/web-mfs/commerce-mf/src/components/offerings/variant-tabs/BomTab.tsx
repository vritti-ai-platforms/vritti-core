import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Boxes, Plus, Sparkles, Wrench } from 'lucide-react';
import type React from 'react';
import { useCallback } from 'react';
import { type BomLineData, FULFILMENT_TYPE_META, type OfferingVariantData } from '@/schemas/offerings';
import { CreateVariantInventoryItemDialog } from '../../inventory-items/forms/CreateVariantInventoryItemDialog';
import type { UseCreateVariantInventoryItem } from '../../inventory-items/types';
import { BomLineCard } from '../components/BomLineCard';
import { AddBomLineDialog } from '../forms/BomLineDialog';
import type {
  OfferingPermissions,
  UseAddBomLine,
  UseAddSuggestedComponent,
  UseDeleteBomLine,
  UseUpdateBomLine,
} from '../types';

interface BomTabProps {
  permissions: OfferingPermissions;
  variant: OfferingVariantData;
  useAdd: UseAddBomLine;
  useUpdate: UseUpdateBomLine;
  useDelete: UseDeleteBomLine;
  useAddSuggested: UseAddSuggestedComponent;
  // Passed only by the organization workspace — a site enables org-owned items rather than creating
  // them, and a company has no inventory-items feature at all
  useCreateVariantInventoryItem?: UseCreateVariantInventoryItem;
}

export const BomTab: React.FC<BomTabProps> = ({
  permissions,
  variant,
  useAdd,
  useUpdate,
  useDelete,
  useAddSuggested,
  useCreateVariantInventoryItem,
}) => {
  const addDialog = useDialog();
  const inventoryItemDialog = useDialog();
  const confirm = useConfirm();

  const meta = FULFILMENT_TYPE_META[variant.fulfilmentType];
  const empty = variant.bom.length === 0;
  const atMax = variant.bom.length >= meta.maxBomLines;

  const deleteMutation = useDelete();
  const suggestionMutation = useAddSuggested();
  const handleRemove = useCallback(
    async (line: BomLineData) => {
      const confirmed = await confirm({
        title: `Remove "${line.inventoryItemName}"?`,
        description:
          variant.bom.length <= meta.minBomLines
            ? `A ${meta.label.toLowerCase()} variant needs ${pluralize('component', meta.minBomLines, true)}, so this variant will stop being sellable.`
            : 'The component will be removed from this bill of materials.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (!confirmed) return;
      deleteMutation.mutate({ variantId: variant.id, lineId: line.id });
    },
    [confirm, meta, deleteMutation, variant],
  );

  // All three stay on screen rather than appearing and disappearing with the variant's state — each
  // says why it cannot be used, which is also how the three routes to a component get taught.
  const linked =
    !!variant.inventoryItem && variant.bom.some((line) => line.inventoryItemId === variant.inventoryItem?.id);

  const suggestionTip = !variant.inventoryItem
    ? `No inventory item carries the SKU ${variant.sku} yet.`
    : linked
      ? `"${variant.inventoryItem.name}" is already a component.`
      : atMax
        ? `A ${meta.label.toLowerCase()} variant takes ${pluralize('component', meta.maxBomLines, true)}.`
        : undefined;

  const createTip = !meta.hasInventoryCounterpart
    ? `A ${meta.label.toLowerCase()} variant resolves to components that are stocked in their own right, not to one item of its own.`
    : variant.inventoryItem
      ? `"${variant.inventoryItem.name}" already carries this SKU.`
      : undefined;

  const actions = (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={inventoryItemDialog.open}
        disabled={!!createTip}
        disabledTip={createTip}
        startAdornment={<Boxes className="size-4" />}
        permission={permissions.variants.bom.createInventoryItem}
      >
        Create Inventory Item
      </Button>

      <Button
        variant="outline"
        onClick={() => suggestionMutation.mutate(variant.id)}
        disabled={!!suggestionTip}
        disabledTip={suggestionTip}
        isLoading={suggestionMutation.isPending}
        loadingText="Adding..."
        startAdornment={<Sparkles className="size-4" />}
        permission={permissions.variants.bom.addFromSuggestion}
      >
        {variant.inventoryItem ? `Add ${variant.inventoryItem.name}` : 'Add from Suggestion'}
      </Button>

      <Button
        onClick={addDialog.open}
        disabled={atMax}
        disabledTip={
          atMax
            ? `A ${meta.label.toLowerCase()} variant takes ${pluralize('component', meta.maxBomLines, true)}.`
            : undefined
        }
        startAdornment={<Plus className="size-4" />}
        permission={permissions.variants.bom.add}
      >
        Add Component
      </Button>
    </div>
  );

  const dialogs = (
    <>
      {useCreateVariantInventoryItem && (
        <Dialog
          handle={inventoryItemDialog}
          icon={Boxes}
          className="max-w-3xl"
          title="Create Inventory Item"
          description={`Inventory counterpart for ${variant.sku}`}
          content={(close) => (
            <CreateVariantInventoryItemDialog
              useCreate={useCreateVariantInventoryItem}
              variant={variant}
              onSuccess={close}
              onCancel={close}
            />
          )}
        />
      )}
      <Dialog
        handle={addDialog}
        icon={Wrench}
        title="Add Component"
        description={variant.sku}
        content={(close) => <AddBomLineDialog variant={variant} useAdd={useAdd} onSuccess={close} onCancel={close} />}
      />
    </>
  );

  if (empty) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Empty
          icon={<Wrench />}
          title="No bill of materials"
          description={
            meta.minBomLines === 0
              ? 'A service draws on nothing stocked. Add a component only if it consumes something.'
              : `This variant needs ${pluralize('component', meta.minBomLines, true)} before it can be made active.`
          }
          action={actions}
        />
        {dialogs}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-xl text-muted-foreground text-sm">
          What one of this variant draws on when it sells. Quantities are in each line's own unit, converted to the
          item's stocking unit at fulfilment.
        </p>
        <div className="flex-none">{actions}</div>
      </div>

      <div className="flex flex-col gap-3">
        {variant.bom.map((line) => (
          <BomLineCard
            key={line.id}
            permissions={permissions}
            variant={variant}
            line={line}
            useUpdate={useUpdate}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {variant.bom.length < meta.minBomLines && (
        <Alert
          variant="warning"
          title="Not sellable yet"
          description={`A ${meta.label.toLowerCase()} variant needs ${pluralize('component', meta.minBomLines, true)}.`}
        />
      )}

      {atMax && meta.maxBomLines === 1 && (
        <Alert
          variant="default"
          title="One component only"
          description={`${meta.description}. Edit or remove the component above to point this variant somewhere else.`}
        />
      )}

      {dialogs}
    </div>
  );
};
