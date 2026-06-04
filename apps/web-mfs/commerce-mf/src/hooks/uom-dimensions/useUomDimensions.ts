import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { UomDimensionData } from '@/schemas/uom-dimensions';
import { listUomDimensions } from '@/services/uom-dimensions.service';
import { UOM_DIMENSIONS_LIST_KEY } from './keys';

export function useUomDimensions(search?: string) {
  return useQuery<UomDimensionData[], AxiosError>({
    queryKey: [...UOM_DIMENSIONS_LIST_KEY, search ?? ''],
    queryFn: () => listUomDimensions(search),
  });
}
