import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { LocationData } from '@/schemas/locations';
import { getLocationById } from '@/site/services/locations.service';
import { LOCATIONS_KEY } from './keys';

export function useLocationById(id: string | null) {
  return useQuery<LocationData, AxiosError>({
    queryKey: [...LOCATIONS_KEY, 'detail', id],
    queryFn: () => getLocationById(id as string),
    enabled: !!id,
  });
}
