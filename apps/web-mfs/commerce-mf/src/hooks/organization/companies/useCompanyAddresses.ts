import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { AddAddressPayload, PartyAddressesTableResponse, PartyAddressRow } from '@/schemas/party-addresses';
import {
  addCompanyAddress,
  getCompanyAddresses,
  removeCompanyAddress,
  updateCompanyAddress,
} from '@/services/organization/companies.service';
import { COMPANY_ADDRESSES_TABLE_KEY, COMPANY_KEY } from './keys';

interface UpdateCompanyAddressVars {
  partyId: string;
  addressId: string;
  data: AddAddressPayload;
}

// Fetches a company's addresses; self-gates on the addresses view permission
export function useCompanyAddresses(
  companyId: string,
  options?: Omit<UseQueryOptions<PartyAddressesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_COMPANIES.addresses.view);
  return useQuery<PartyAddressesTableResponse, AxiosError>({
    queryKey: COMPANY_ADDRESSES_TABLE_KEY(companyId),
    queryFn: () => getCompanyAddresses(companyId),
    ...options,
    enabled: !!companyId && available && (options?.enabled ?? true),
  });
}

export function useAddCompanyAddress(
  companyId: string,
  options?: Omit<UseMutationOptions<PartyAddressRow, AxiosError, AddAddressPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartyAddressRow, AxiosError, AddAddressPayload>({
    ...options,
    mutationFn: (data) => addCompanyAddress({ partyId: companyId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_ADDRESSES_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateCompanyAddress(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateCompanyAddressVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateCompanyAddressVars>({
    ...options,
    mutationFn: (vars) => updateCompanyAddress(vars),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_ADDRESSES_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useRemoveCompanyAddress(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (addressId) => removeCompanyAddress({ partyId: companyId, addressId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_ADDRESSES_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}
