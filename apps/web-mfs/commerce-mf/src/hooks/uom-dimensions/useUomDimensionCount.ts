import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { UomDimensionCountData } from '@/schemas/uom-dimensions';
import { getUomDimensionCount } from '@/services/uom-dimensions.service';
import { UOM_DIMENSIONS_COUNT_KEY } from './keys';

export function useUomDimensionCount() {
  return useSuspenseQuery<UomDimensionCountData, AxiosError>({
    queryKey: UOM_DIMENSIONS_COUNT_KEY,
    queryFn: () => getUomDimensionCount(),
  });
}
