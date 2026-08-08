import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { deleteProfilePhoto } from '@/services/account/profile.service';
import { PROFILE_QUERY_KEY } from './useProfile';

type UseDeleteProfilePhotoOptions = Omit<UseMutationOptions<void, AxiosError, void>, 'mutationFn'>;

export function useDeleteProfilePhoto(options?: UseDeleteProfilePhotoOptions) {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, void>({
    ...options,
    mutationFn: deleteProfilePhoto,
    onSuccess: (result, ...args) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      options?.onSuccess?.(result, ...args);
    },
  });
}
