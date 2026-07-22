import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  PartyCommunicationPayload,
  PartyCommunicationRow,
  PartyCommunicationsTableResponse,
  PartyCommunicationUpdatePayload,
} from '@/schemas/party-communications';
import {
  createCompanyCommunication,
  deleteCompanyCommunication,
  getCompanyCommunications,
  updateCompanyCommunication,
} from '@/services/organization/companies.service';
import { COMPANY_COMMUNICATIONS_TABLE_KEY, COMPANY_KEY } from './keys';

// Fetches a company's communications; self-gates on the communications view permission
export function useCompanyCommunicationsTable(
  companyId: string,
  options?: Omit<UseQueryOptions<PartyCommunicationsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_COMPANIES.communications.view);
  return useQuery<PartyCommunicationsTableResponse, AxiosError>({
    queryKey: COMPANY_COMMUNICATIONS_TABLE_KEY(companyId),
    queryFn: () => getCompanyCommunications(companyId),
    ...options,
    enabled: !!companyId && available && (options?.enabled ?? true),
  });
}

export function useCreateCompanyCommunication(
  companyId: string,
  options?: Omit<UseMutationOptions<PartyCommunicationRow, AxiosError, PartyCommunicationPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartyCommunicationRow, AxiosError, PartyCommunicationPayload>({
    ...options,
    mutationFn: (data) => createCompanyCommunication({ companyId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_COMMUNICATIONS_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateCommunicationVars {
  communicationId: string;
  data: PartyCommunicationUpdatePayload;
}

export function useUpdateCompanyCommunication(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateCommunicationVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateCommunicationVars>({
    ...options,
    mutationFn: ({ communicationId, data }) => updateCompanyCommunication({ companyId, communicationId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_COMMUNICATIONS_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteCompanyCommunication(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (communicationId) => deleteCompanyCommunication({ companyId, communicationId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_COMMUNICATIONS_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}
