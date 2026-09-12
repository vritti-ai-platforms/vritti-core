import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import type React from 'react';
import { StatusSwitch } from '@/components/StatusSwitch';
import { FULFILMENT_TYPE_META } from '@/schemas/offerings';
import type { OfferingsBinding } from './bindings';
import { VariantHeaderActions } from './components/VariantHeaderActions';
import { BomTab } from './variant-tabs/BomTab';
import { OverviewTab } from './variant-tabs/OverviewTab';

interface VariantDetailProps {
  binding: OfferingsBinding;
}

export const VariantDetail: React.FC<VariantDetailProps> = ({ binding }) => {
  const { permissions: PERMISSIONS } = binding;
  const { slug, variantSlug } = useSlugParams('slug', 'variantSlug');
  const { data: offering } = binding.useOffering(slug.id);
  const { data: variant } = binding.useVariant(variantSlug.id);
  const setStatusMutation = binding.useUpdateVariant();
  const meta = FULFILMENT_TYPE_META[offering.fulfilmentType];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6">
      <PageHeader
        title={variant.sku}
        description={variant.name}
        titleSlot={
          <StatusSwitch
            size="md"
            checked={variant.isActive}
            permission={PERMISSIONS.variants.edit}
            disabled={!variant.canMarkActive || setStatusMutation.isPending}
            disabledTip={`A ${meta.label.toLowerCase()} variant needs its bill of materials first.`}
            onCheckedChange={(isActive) => setStatusMutation.mutate({ id: variant.id, data: { isActive } })}
            ariaLabel={`Mark ${variant.sku} active`}
          />
        }
        actions={
          <VariantHeaderActions
            permissions={PERMISSIONS}
            variant={variant}
            useSetTaxClass={binding.useSetVariantTaxClass}
            useClearTaxClass={binding.useClearVariantTaxClass}
          />
        }
      />

      <Tabs
        routeParam="tab"
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <OverviewTab offering={offering} variant={variant} />,
          },
          {
            value: 'bom',
            label: 'Bill of Materials',
            permission: PERMISSIONS.variants.bom.view,
            content: (
              <BomTab
                permissions={PERMISSIONS}
                offering={offering}
                variant={variant}
                useAdd={binding.useAddBomLine}
                useUpdate={binding.useUpdateBomLine}
                useDelete={binding.useDeleteBomLine}
                useAddSuggested={binding.useAddSuggestedComponent}
                useCreateVariantInventoryItem={binding.useCreateVariantInventoryItem}
              />
            ),
          },
        ]}
      />
    </div>
  );
};
