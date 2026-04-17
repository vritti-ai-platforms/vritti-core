import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getDeployments } from '../../services/auth/deployment.service';
import type { Deployment } from '../../types/deployment';

type UseDeploymentsOptions = Omit<UseQueryOptions<Deployment[], AxiosError>, 'queryKey' | 'queryFn'>;

export function useDeployments(options?: UseDeploymentsOptions) {
  return useQuery<Deployment[], AxiosError>({
    queryKey: ['auth', 'deployments'],
    queryFn: getDeployments,
    ...options,
  });
}
