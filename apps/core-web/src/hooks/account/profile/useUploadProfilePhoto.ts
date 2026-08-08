import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type ProfilePhotoResult, uploadProfilePhoto } from '@/services/account/profile.service';
import { PROFILE_QUERY_KEY } from './useProfile';

type UseUploadProfilePhotoOptions = Omit<UseMutationOptions<ProfilePhotoResult, AxiosError, File>, 'mutationFn'>;

export function useUploadProfilePhoto(options?: UseUploadProfilePhotoOptions) {
  const queryClient = useQueryClient();

  return useMutation<ProfilePhotoResult, AxiosError, File>({
    ...options,
    mutationFn: uploadProfilePhoto,
    onSuccess: (result, ...args) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      options?.onSuccess?.(result, ...args);
    },
  });
}
