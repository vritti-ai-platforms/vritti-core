import { type UseQueryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { SupplierQuotationDetail, SupplierQuotationsTableResponse } from '@/schemas/supplier-quotations';
import {
  getSupplierQuotation,
  getSupplierQuotationsTable,
  getSupplierSiteQuotationsTable,
} from '@/services/legal-entity/supplier-quotations.service';
import { SUPPLIER_QUOTATION_KEY, SUPPLIER_QUOTATIONS_TABLE_KEY, SUPPLIER_SITE_QUOTATIONS_TABLE_KEY } from './keys';

// Fetches a supplier's quotations; self-gates on the quotations view permission
export function useSupplierQuotationsTable(
  supplierId: string,
  options?: Omit<UseQueryOptions<SupplierQuotationsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(LE_SUPPLIERS.quotations.view);
  return useQuery<SupplierQuotationsTableResponse, AxiosError>({
    queryKey: SUPPLIER_QUOTATIONS_TABLE_KEY(supplierId),
    queryFn: () => getSupplierQuotationsTable(supplierId),
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}

// Fetches a supplier's quotations posted to one site; waits for the site and self-gates on the quotations view
// permission
export function useSupplierSiteQuotationsTable(supplierId: string, siteId: string | undefined) {
  const { available } = usePermission(LE_SUPPLIERS.quotations.view);
  return useQuery<SupplierQuotationsTableResponse, AxiosError>({
    queryKey: SUPPLIER_SITE_QUOTATIONS_TABLE_KEY(supplierId, siteId ?? ''),
    queryFn: () => getSupplierSiteQuotationsTable(supplierId, siteId as string),
    enabled: available && !!siteId,
  });
}

export function useSupplierQuotation(supplierId: string, quotationId: string) {
  return useSuspenseQuery<SupplierQuotationDetail, AxiosError>({
    queryKey: SUPPLIER_QUOTATION_KEY(supplierId, quotationId),
    queryFn: () => getSupplierQuotation(supplierId, quotationId),
  });
}
