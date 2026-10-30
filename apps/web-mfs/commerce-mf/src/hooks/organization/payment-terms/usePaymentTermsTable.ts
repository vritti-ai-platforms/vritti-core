import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_PAYMENT_TERMS } from '@vritti/commerce-permissions/payment-terms';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PaymentTermsTableResponse } from '@/schemas/payment-terms';
import { getPaymentTermsTable } from '@/services/organization/payment-terms.service';
import { PAYMENT_TERMS_TABLE_KEY } from './keys';

export function usePaymentTermsTable(
  options?: Omit<UseQueryOptions<PaymentTermsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_PAYMENT_TERMS.view);
  return useQuery<PaymentTermsTableResponse, AxiosError>({
    queryKey: [...PAYMENT_TERMS_TABLE_KEY],
    queryFn: getPaymentTermsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
