import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type LookupResponse, lookupOrganizations } from '../../services/auth.service';

type UseLookupOrganizationsOptions = Omit<UseMutationOptions<LookupResponse, AxiosError, string>, 'mutationFn'>;

// Looks up organizations for an email address
export function useLookupOrganizations(options?: UseLookupOrganizationsOptions) {
  return useMutation<LookupResponse, AxiosError, string>({
    ...options,
    mutationFn: lookupOrganizations,
  });
}
