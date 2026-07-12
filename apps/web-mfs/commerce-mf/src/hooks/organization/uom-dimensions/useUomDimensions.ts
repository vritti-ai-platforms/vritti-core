import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { listUomDimensions } from '@/services/organization/uom-dimensions.service';
import type { UomDimensionData } from '@/schemas/uom-dimensions';
import { UOM_DIMENSIONS_LIST_KEY } from './keys';

export function useUomDimensions(search?: string) {
  return useQuery<UomDimensionData[], AxiosError>({
    queryKey: [...UOM_DIMENSIONS_LIST_KEY, search ?? ''],
    queryFn: () => listUomDimensions(search),
  });
}
