import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type LookupOrganizationsDto, type LookupResponse, lookupOrganizations } from '../../services/auth/auth.service';

type UseLookupOrganizationsOptions = Omit<UseMutationOptions<LookupResponse, AxiosError, LookupOrganizationsDto>, 'mutationFn'>;

// Looks up organizations for an email address
export function useLookupOrganizations(options?: UseLookupOrganizationsOptions) {
  return useMutation<LookupResponse, AxiosError, LookupOrganizationsDto>({
    ...options,
    mutationFn: lookupOrganizations,
  });
}
