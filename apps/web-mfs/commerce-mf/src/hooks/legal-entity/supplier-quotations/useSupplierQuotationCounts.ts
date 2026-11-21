import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierQuotationCounts } from '@/schemas/supplier-quotations';
import { getSupplierQuotationCounts } from '@/services/legal-entity/supplier-quotations.service';
import { SUPPLIER_QUOTATION_COUNTS_KEY } from './keys';

// Fetches how many lines and site postings a quotation has, one per tab; under the quotation's key, so whatever
// refreshes the quotation refreshes them
export function useSupplierQuotationCounts(supplierId: string, quotationId: string) {
  return useQuery<SupplierQuotationCounts, AxiosError>({
    queryKey: SUPPLIER_QUOTATION_COUNTS_KEY(supplierId, quotationId),
    queryFn: () => getSupplierQuotationCounts(supplierId, quotationId),
  });
}
