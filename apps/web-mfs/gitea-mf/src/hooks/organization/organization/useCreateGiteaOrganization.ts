import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { OrganizationData } from '@/schemas/organization';
import { createOrganization } from '@/services/organization/organization.service';
import { GITEA_ORGANIZATION_KEY } from './keys';

type Options = Omit<UseMutationOptions<CreateResponse<OrganizationData>, AxiosError, void>, 'mutationFn'>;

export function useCreateGiteaOrganization(options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<OrganizationData>, AxiosError, void>({
    mutationFn: createOrganization,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GITEA_ORGANIZATION_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
