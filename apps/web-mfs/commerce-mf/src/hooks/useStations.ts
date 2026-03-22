import { type UseMutationOptions, type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateStationInput, Station, UpdateStationInput } from '../schemas';
import { createStation, deleteStation, getStations, updateStation } from '../services';

type UseStationsOptions = Omit<UseQueryOptions<Station[], Error>, 'queryKey' | 'queryFn'>;

// Fetches all stations for an org+bu
export function useStations(businessUnitId: string, options?: UseStationsOptions) {
  return useQuery<Station[], Error>({
    queryKey: ['commerce', 'stations', businessUnitId],
    queryFn: () => getStations(businessUnitId),
    enabled: !!businessUnitId,
    ...options,
  });
}

type UseCreateStationOptions = Omit<
  UseMutationOptions<Station, Error, CreateStationInput & { businessUnitId: string }>,
  'mutationFn'
>;

// Creates a new station and invalidates the list
export function useCreateStation(options?: UseCreateStationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStation,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'stations'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

interface UpdateStationParams {
  id: string;
  data: UpdateStationInput;
}

type UseUpdateStationOptions = Omit<UseMutationOptions<unknown, Error, UpdateStationParams>, 'mutationFn'>;

// Updates a station and invalidates the list
export function useUpdateStation(options?: UseUpdateStationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateStationParams) => updateStation(id, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'stations'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

type UseDeleteStationOptions = Omit<UseMutationOptions<unknown, Error, string>, 'mutationFn'>;

// Deletes a station and invalidates the list
export function useDeleteStation(options?: UseDeleteStationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStation,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'stations'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
