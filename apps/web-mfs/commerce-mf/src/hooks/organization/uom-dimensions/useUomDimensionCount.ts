import { useQuery } from '@tanstack/react-query';
import { ORG_UOM } from '@vritti/commerce-permissions/uom';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { UomDimensionCountData } from '@/schemas/uom-dimensions';
import { getUomDimensionCount } from '@/services/organization/uom-dimensions.service';
import { UOM_DIMENSIONS_COUNT_KEY } from './keys';

export function useUomDimensionCount() {
  const { available } = usePermission(ORG_UOM.dim.view);
  return useQuery<UomDimensionCountData, AxiosError>({
    queryKey: UOM_DIMENSIONS_COUNT_KEY,
    queryFn: () => getUomDimensionCount(),
    enabled: available,
  });
}
