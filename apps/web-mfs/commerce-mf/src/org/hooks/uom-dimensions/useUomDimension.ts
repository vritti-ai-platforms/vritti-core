import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getUomDimension } from '@/org/services/uom-dimensions.service';
import type { UomDimensionData } from '@/schemas/uom-dimensions';
import { UOM_DIMENSION_DETAIL_KEY } from './keys';

export function useUomDimension(id: string | null) {
  return useQuery<UomDimensionData, AxiosError>({
    queryKey: UOM_DIMENSION_DETAIL_KEY(id ?? ''),
    queryFn: () => getUomDimension(id as string),
    enabled: !!id,
  });
}
