import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { AddAddressPayload, PartyAddressesTableResponse, PartyAddressRow } from '@/schemas/party-addresses';
import {
  addPersonAddress,
  getPersonAddresses,
  removePersonAddress,
  updatePersonAddress,
} from '@/services/organization/people.service';
import { PERSON_ADDRESSES_TABLE_KEY, PERSON_KEY } from './keys';

interface UpdatePersonAddressVars {
  partyId: string;
  addressId: string;
  data: AddAddressPayload;
}

// Fetches a person's addresses; self-gates on the addresses view permission
export function usePersonAddresses(
  personId: string,
  options?: Omit<UseQueryOptions<PartyAddressesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_PEOPLE.addresses.view);
  return useQuery<PartyAddressesTableResponse, AxiosError>({
    queryKey: PERSON_ADDRESSES_TABLE_KEY(personId),
    queryFn: () => getPersonAddresses(personId),
    ...options,
    enabled: !!personId && available && (options?.enabled ?? true),
  });
}

export function useAddPersonAddress(
  personId: string,
  options?: Omit<UseMutationOptions<PartyAddressRow, AxiosError, AddAddressPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartyAddressRow, AxiosError, AddAddressPayload>({
    ...options,
    mutationFn: (data) => addPersonAddress({ partyId: personId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_ADDRESSES_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdatePersonAddress(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdatePersonAddressVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePersonAddressVars>({
    ...options,
    mutationFn: (vars) => updatePersonAddress(vars),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_ADDRESSES_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useRemovePersonAddress(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (addressId) => removePersonAddress({ partyId: personId, addressId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_ADDRESSES_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}
