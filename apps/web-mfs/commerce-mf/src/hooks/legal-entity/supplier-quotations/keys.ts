import { SUPPLIER_KEY } from '@/hooks/legal-entity/suppliers/keys';

export const SUPPLIER_QUOTATIONS_KEY = (supplierId: string) => [...SUPPLIER_KEY(supplierId), 'quotations'] as const;
export const SUPPLIER_QUOTATIONS_TABLE_KEY = (supplierId: string) =>
  [...SUPPLIER_QUOTATIONS_KEY(supplierId), 'table'] as const;
export const SUPPLIER_QUOTATION_KEY = (supplierId: string, quotationId: string) =>
  [...SUPPLIER_QUOTATIONS_KEY(supplierId), quotationId] as const;
export const SUPPLIER_SITE_QUOTATIONS_TABLE_KEY = (supplierId: string, siteId: string) =>
  [...SUPPLIER_QUOTATIONS_KEY(supplierId), 'site', siteId, 'table'] as const;
