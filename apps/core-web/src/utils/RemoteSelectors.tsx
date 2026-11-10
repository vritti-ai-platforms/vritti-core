import { loadRemote } from '@module-federation/enhanced/runtime';
import type { SelectProps, SingleSelectAnchorProps } from '@vritti/quantum-ui/Select';
import { type ComponentType, lazy, Suspense } from 'react';

const IDLE_ANCHOR: SingleSelectAnchorProps = { selectedOption: undefined, open: false, disabled: true };

// What a remote selector shows while it loads, or when its MF cannot be reached: the caller's own anchor, unselected
function AnchorOnly({ anchor }: SelectProps) {
  return anchor ? anchor(IDLE_ANCHOR) : null;
}

// A selector owned by an MF, loaded from the module it exposes so the host never keeps its own copy
function remoteSelector<P extends SelectProps>(moduleId: string, exportName: string): ComponentType<P> {
  const Remote = lazy(async (): Promise<{ default: ComponentType<P> }> => {
    try {
      const exposed = await loadRemote<Record<string, ComponentType<P>>>(moduleId);
      const component = exposed?.[exportName];
      if (component) return { default: component };
      console.error(`[RemoteSelectors] ${moduleId} does not export ${exportName}`);
    } catch (error) {
      console.error(`[RemoteSelectors] Failed to load ${moduleId}:`, error);
    }
    return { default: AnchorOnly };
  });

  return (props: P) => (
    <Suspense fallback={<AnchorOnly {...props} />}>
      <Remote {...props} />
    </Suspense>
  );
}

export const OfferingSelector = remoteSelector<SelectProps & { catalogId?: string }>(
  'commerce/Selectors/Offering',
  'OfferingSelector',
);

export const OfferingVariantSelector = remoteSelector<SelectProps & { offeringId?: string; catalogId?: string }>(
  'commerce/Selectors/OfferingVariant',
  'OfferingVariantSelector',
);

export const InventoryItemSelector = remoteSelector<Omit<SelectProps, 'optionsEndpoint'>>(
  'commerce/Selectors/InventoryItem',
  'InventoryItemSelector',
);

export const PaymentTermSelector = remoteSelector<
  Omit<SelectProps, 'optionsEndpoint'> & { allowUnpublished?: boolean }
>('commerce/Selectors/PaymentTerm', 'PaymentTermSelector');

export const SupplierSelector = remoteSelector<Omit<SelectProps, 'optionsEndpoint'> & { activeOnly?: boolean }>(
  'commerce/Selectors/Supplier',
  'SupplierSelector',
);

export const SupplierItemSelector = remoteSelector<
  Omit<SelectProps, 'optionsEndpoint' | 'params'> & { params?: { supplierId?: string } }
>('commerce/Selectors/SupplierItem', 'SupplierItemSelector');

export const SiteSupplierSelector = remoteSelector<
  Omit<SelectProps, 'optionsEndpoint'> & { enrollmentStatus?: 'ENROLLED' | 'NOT_ENROLLED'; activeOnly?: boolean }
>('commerce/Selectors/SiteSupplier', 'SiteSupplierSelector');

export const SiteSelector = remoteSelector<Omit<SelectProps, 'optionsEndpoint'>>(
  'commerce/Selectors/Site',
  'SiteSelector',
);

export const RepositorySelector = remoteSelector<Omit<SelectProps, 'optionsEndpoint'>>(
  'gitea/Selectors/Repository',
  'RepositorySelector',
);

export const WhatsappAccountSelector = remoteSelector<Omit<SelectProps, 'optionsEndpoint'>>(
  'communications/Selectors/WhatsappAccount',
  'WhatsappAccountSelector',
);

export const SmsProviderSelector = remoteSelector<Omit<SelectProps, 'optionsEndpoint'>>(
  'communications/Selectors/SmsProvider',
  'SmsProviderSelector',
);

export const TaxClassSelector = remoteSelector<Omit<SelectProps, 'optionsEndpoint'>>(
  'commerce/Selectors/TaxClass',
  'TaxClassSelector',
);

export const TaxGroupSelector = remoteSelector<Omit<SelectProps, 'optionsEndpoint'> & { anyCountry: true }>(
  'commerce/Selectors/TaxGroup',
  'TaxGroupSelector',
);
