import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { LocationCountData } from '@/schemas/locations';
import { getLocationCount } from '@/services/locations.service';
import { LOCATION_COUNT_KEY } from './keys';

export function useLocationCount() {
  return useSuspenseQuery<LocationCountData, AxiosError>({
    queryKey: LOCATION_COUNT_KEY,
    queryFn: () => getLocationCount(),
  });
}
