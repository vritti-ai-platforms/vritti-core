import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { UpdateLocationData } from '@/schemas/storage-locations';
import { updateLocation } from '@/services/storage-locations.service';
import { LOCATIONS_KEY } from './useLocations';

export function useUpdateLocation(
	options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateLocationData }>, 'mutationFn'>,
) {
	const queryClient = useQueryClient();

	return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateLocationData }>({
		...options,
		mutationFn: updateLocation,
		onSuccess: (...args) => {
			queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
			options?.onSuccess?.(...args);
		},
	});
}
