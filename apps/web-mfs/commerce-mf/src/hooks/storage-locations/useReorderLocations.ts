import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { ReorderLocationsData } from '@/schemas/storage-locations';
import { reorderLocations } from '@/services/storage-locations.service';
import { LOCATIONS_KEY } from './useLocations';

export function useReorderLocations(
	options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ReorderLocationsData>, 'mutationFn'>,
) {
	const queryClient = useQueryClient();

	return useMutation<SuccessResponse, AxiosError, ReorderLocationsData>({
		...options,
		mutationFn: reorderLocations,
		onSuccess: (...args) => {
			queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
			options?.onSuccess?.(...args);
		},
	});
}
