import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { SupplierQuotationDetail, SupplierQuotationsTableResponse } from '@/schemas/supplier-quotations';
import { getSupplierQuotation, getSupplierQuotationsTable } from '@/services/site/supplier-quotations.service';
import { SITE_SUPPLIER_QUOTATION_KEY, SITE_SUPPLIER_QUOTATIONS_TABLE_KEY } from './keys';

// Fetches the supplier's quotations the session site reads; self-gates on the quotations view permission
export function useSupplierQuotationsTable(supplierId: string) {
  const { available } = usePermission(SITE_SUPPLIERS.quotations.view);
  return useQuery<SupplierQuotationsTableResponse, AxiosError>({
    queryKey: SITE_SUPPLIER_QUOTATIONS_TABLE_KEY(supplierId),
    queryFn: () => getSupplierQuotationsTable(supplierId),
    enabled: !!supplierId && available,
  });
}

// Fetches a quotation the session site reads, for its page
export function useSupplierQuotation(supplierId: string, quotationId: string) {
  return useSuspenseQuery<SupplierQuotationDetail, AxiosError>({
    queryKey: SITE_SUPPLIER_QUOTATION_KEY(supplierId, quotationId),
    queryFn: () => getSupplierQuotation(supplierId, quotationId),
  });
}
