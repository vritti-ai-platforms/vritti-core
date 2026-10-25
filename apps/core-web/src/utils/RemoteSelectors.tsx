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
