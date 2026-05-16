import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ModifierOptionData } from '@/schemas/items';
import { updateModifierOption } from '@/services/modifier-groups.service';
import { MODIFIER_GROUPS_KEY } from './keys';

interface UpdateModifierOptionParams {
  groupId: string;
  optionId: string;
  data: { name?: string; additionalPrice?: number; isDefault?: boolean; isAvailable?: boolean };
}

type UseUpdateModifierOptionOptions = Omit<
  UseMutationOptions<ModifierOptionData, AxiosError, UpdateModifierOptionParams>,
  'mutationFn'
>;

// Updates a modifier option's properties
export function useUpdateModifierOption(options?: UseUpdateModifierOptionOptions) {
  const queryClient = useQueryClient();
  return useMutation<ModifierOptionData, AxiosError, UpdateModifierOptionParams>({
    ...options,
    mutationFn: updateModifierOption,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: MODIFIER_GROUPS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
