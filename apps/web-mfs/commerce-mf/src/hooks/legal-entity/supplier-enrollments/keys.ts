import { SUPPLIER_KEY } from '@/hooks/legal-entity/suppliers/keys';

export const SUPPLIER_ENROLLMENTS_KEY = (supplierId: string) => [...SUPPLIER_KEY(supplierId), 'enrollments'] as const;
export const SUPPLIER_ENROLLMENTS_TABLE_KEY = (supplierId: string) =>
  [...SUPPLIER_ENROLLMENTS_KEY(supplierId), 'table'] as const;
export const SUPPLIER_ENROLLMENT_KEY = (supplierId: string, siteId: string) =>
  [...SUPPLIER_ENROLLMENTS_KEY(supplierId), siteId] as const;
export const SUPPLIER_ENROLLMENT_COUNTS_KEY = (supplierId: string, siteId: string) =>
  [...SUPPLIER_ENROLLMENT_KEY(supplierId, siteId), 'counts'] as const;
export const SUPPLIER_ENROLLMENT_SITE_ITEMS_TABLE_KEY = (supplierId: string, siteId: string) =>
  [...SUPPLIER_ENROLLMENT_KEY(supplierId, siteId), 'site-items', 'table'] as const;
