import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { cn } from '@vritti/quantum-ui/cn';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { TaxGroupSelector } from '@vritti/quantum-ui/selects/tax-group';
import { VariantOptionSelector } from '@vritti/quantum-ui/selects/variant-option';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { Boxes, ChefHat, type LucideIcon, Package, Wrench } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { type CreateOfferingFormData, createOfferingSchema, type FulfilmentType } from '@/schemas/offerings';
import { useCreateOffering } from '@/hooks/site/offerings';
import type { CreateOfferingDefaultVariant, CreateOfferingPayload } from '@/services/site/offerings.service';
import { VariantComponentsField } from '../../components/offerings/VariantComponentsField';

type OfferingKind = 'STOCK_SINGLE' | 'STOCK_VARIANTS' | 'SERVICE' | 'COMPOSITE';

const KIND_OPTIONS: { value: OfferingKind; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'STOCK_SINGLE', label: 'Stocked', description: 'Sells one inventory item', icon: Package },
  { value: 'STOCK_VARIANTS', label: 'Stocked with variants', description: 'Size / colour combinations', icon: Boxes },
  { value: 'SERVICE', label: 'Service', description: 'No inventory', icon: Wrench },
  { value: 'COMPOSITE', label: 'Composite', description: 'Recipe / bill of materials', icon: ChefHat },
];

function kindToFulfilment(kind: OfferingKind): FulfilmentType {
  if (kind === 'SERVICE') return 'SERVICE';
  if (kind === 'COMPOSITE') return 'COMPOSITE';
  return 'STOCK';
}

interface AddOfferingDialogProps {
  catalogId: string;
  currencyCode: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddOfferingDialog: React.FC<AddOfferingDialogProps> = ({
  catalogId,
  currencyCode,
  onSuccess,
  onCancel,
}) => {
  const [kind, setKind] = useState<OfferingKind>('STOCK_SINGLE');
  const [inventoryItemId, setInventoryItemId] = useState<string | undefined>(undefined);

  const form = useForm<CreateOfferingFormData>({
    resolver: zodResolver(createOfferingSchema) as Resolver<CreateOfferingFormData>,
    defaultValues: {
      fulfilmentType: 'STOCK',
      name: '',
      description: '',
      categoryId: undefined,
      salesTaxGroupId: undefined,
      isAvailable: true,
      variantOptionIds: [],
      sku: '',
      price: { currency: currencyCode, value: '' },
      components: [],
    },
  });

  const mutation = useCreateOffering({ onSuccess });

  const selectKind = (value: OfferingKind) => {
    setKind(value);
    form.setValue('fulfilmentType', kindToFulfilment(value));
  };

  // Stocked 1-on-1: derive name/category/SKU from the picked item (all editable afterward).
  const prefillFromItem = (option: SelectOption | null) => {
    setInventoryItemId((option?.value as string) ?? undefined);
    if (!option) return;
    if (!form.getValues('name')?.trim()) form.setValue('name', option.label, { shouldValidate: true });
    if (option.groupId) form.setValue('categoryId', String(option.groupId));
    const code = option.additionals?.code;
    if (code != null && !form.getValues('sku')?.trim()) form.setValue('sku', String(code));
  };

  const buildDefaultVariant = (data: CreateOfferingFormData): CreateOfferingDefaultVariant | undefined => {
    const sku = data.sku;
    const price = { currency: data.price?.currency ?? currencyCode, value: data.price?.value || '0' };

    if (kind === 'STOCK_SINGLE') {
      if (!inventoryItemId) return undefined;
      return { sku, price, components: [{ inventoryItemId, quantity: 1 }] };
    }
    if (kind === 'SERVICE') return { sku, price, components: [] };
    if (kind === 'COMPOSITE') return { sku, price, components: data.components ?? [] };
    return undefined;
  };

  const transformSubmit = (data: CreateOfferingFormData): { catalogId: string; data: CreateOfferingPayload } => ({
    catalogId,
    data: {
      catalogId,
      fulfilmentType: kindToFulfilment(kind),
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      salesTaxGroupId: data.salesTaxGroupId,
      isAvailable: data.isAvailable,
      variantOptionIds: data.variantOptionIds?.length ? data.variantOptionIds : undefined,
      defaultVariant: buildDefaultVariant(data),
    },
  });

  return (
    <Form form={form} mutation={mutation} transformSubmit={transformSubmit} onCancel={onCancel} resetOnSuccess>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Typography variant="subtitle2">What are you selling?</Typography>
          <div className="grid grid-cols-2 gap-3">
            {KIND_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = kind === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectKind(opt.value)}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    selected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/40 hover:shadow-sm',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-md transition-colors',
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium leading-none">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {kind === 'STOCK_SINGLE' && (
          <InventoryItemSelector
            label="Inventory Item"
            clearable
            value={inventoryItemId}
            onOptionSelect={prefillFromItem}
            fieldKeys={{ additionalKeys: 'code' }}
          />
        )}

        <TextField
          name="name"
          label="Name"
          placeholder={kind === 'STOCK_SINGLE' ? 'Auto-filled from the item — editable' : 'e.g. Classic Tee'}
        />

        <div className="grid grid-cols-2 gap-4">
          <CategorySelector name="categoryId" clearable />
          <TaxGroupSelector name="salesTaxGroupId" label="Sales Tax Group" placeholder="Select tax group" />
        </div>

        {kind === 'STOCK_VARIANTS' && (
          <VariantOptionSelector name="variantOptionIds" catalogId={catalogId} label="Variant options" clearable />
        )}

        {kind !== 'STOCK_VARIANTS' && (
          <div className="grid grid-cols-2 gap-4">
            <TextField
              name="sku"
              label="SKU"
              placeholder={kind === 'STOCK_SINGLE' ? 'From item code' : 'e.g. SVC-001'}
            />
            <CurrencyField name="price" label="Price" currencyCode={currencyCode} placeholder="0.00" />
          </div>
        )}

        {kind === 'COMPOSITE' && <VariantComponentsField name="components" label="Components" />}

        <TextArea name="description" label="Description" placeholder="Optional description" rows={2} />

        <Switch
          name="isAvailable"
          label="Available for ordering"
          description="When off, the offering is hidden from POS and order forms"
        />
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Offering
        </Button>
      </DialogActions>
    </Form>
  );
};
