import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { UomDimensionData } from '@/schemas/uom-dimensions';
import { getUomDimension } from '@/services/uom-dimensions.service';
import { UOM_DIMENSION_DETAIL_KEY } from './keys';

export function useUomDimension(id: string | null) {
  return useQuery<UomDimensionData, AxiosError>({
    queryKey: UOM_DIMENSION_DETAIL_KEY(id ?? ''),
    queryFn: () => getUomDimension(id as string),
    enabled: !!id,
  });
}
