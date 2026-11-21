import { SITE_SUPPLIER_KEY } from '@/hooks/site/suppliers/keys';

export const SITE_SUPPLIER_QUOTATIONS_KEY = (supplierId: string) =>
  [...SITE_SUPPLIER_KEY(supplierId), 'quotations'] as const;
export const SITE_SUPPLIER_QUOTATIONS_TABLE_KEY = (supplierId: string) =>
  [...SITE_SUPPLIER_QUOTATIONS_KEY(supplierId), 'table'] as const;
export const SITE_SUPPLIER_QUOTATION_KEY = (supplierId: string, quotationId: string) =>
  [...SITE_SUPPLIER_QUOTATIONS_KEY(supplierId), quotationId] as const;
export const SITE_SUPPLIER_QUOTATION_COUNTS_KEY = (supplierId: string, quotationId: string) =>
  [...SITE_SUPPLIER_QUOTATION_KEY(supplierId, quotationId), 'counts'] as const;
