import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateProfilePictureData } from '@/schemas/whatsapp-phone-numbers';
import { updateWhatsappPhoneNumberProfilePicture } from '@/services/organization/whatsapp-phone-numbers.service';
import { WHATSAPP_PHONE_NUMBER_PROFILE_KEY } from './keys';

interface UpdatePhoneNumberProfilePictureVariables {
  accountId: string;
  phoneNumberId: string;
  data: UpdateProfilePictureData;
}

type Options = Omit<
  UseMutationOptions<SuccessResponse, AxiosError, UpdatePhoneNumberProfilePictureVariables>,
  'mutationFn'
>;

export function useUpdatePhoneNumberProfilePicture(options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpdatePhoneNumberProfilePictureVariables>({
    mutationFn: ({ accountId, phoneNumberId, data }) =>
      updateWhatsappPhoneNumberProfilePicture(accountId, phoneNumberId, data),
    ...options,
    onSuccess: (...args) => {
      const { accountId, phoneNumberId } = args[1];
      queryClient.invalidateQueries({ queryKey: WHATSAPP_PHONE_NUMBER_PROFILE_KEY(accountId, phoneNumberId) });
      options?.onSuccess?.(...args);
    },
  });
}
