import { useQuery } from '@tanstack/react-query';
import { ORG_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { VariantBomData } from '@/schemas/offerings';
import { getVariantBom } from '@/services/organization/offerings.service';
import { VARIANT_BOM_KEY } from './keys';
import type { Options } from './options';

// The bill of materials, fetched by the tab that shows it rather than riding on the variant.
export function useVariantBom(variantId: string, options?: Options<VariantBomData>) {
  const { available } = usePermission(ORG_OFFERINGS.variants.bom.view);
  return useQuery<VariantBomData, AxiosError>({
    queryKey: [...VARIANT_BOM_KEY(variantId)],
    queryFn: () => getVariantBom(variantId),
    ...options,
    enabled: available && !!variantId && (options?.enabled ?? true),
  });
}
