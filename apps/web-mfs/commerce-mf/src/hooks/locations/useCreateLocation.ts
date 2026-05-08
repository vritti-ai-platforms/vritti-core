import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreateLocationResponse, LocationFormData } from '@/schemas/locations';
import { createLocation } from '@/services/locations.service';
import { LOCATIONS_KEY } from './keys';

export function useCreateLocation(
	options?: Omit<UseMutationOptions<CreateLocationResponse, AxiosError, LocationFormData>, 'mutationFn'>,
) {
	const queryClient = useQueryClient();

	return useMutation<CreateLocationResponse, AxiosError, LocationFormData>({
		...options,
		mutationFn: createLocation,
		onSuccess: (...args) => {
			queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
			options?.onSuccess?.(...args);
		},
	});
}
