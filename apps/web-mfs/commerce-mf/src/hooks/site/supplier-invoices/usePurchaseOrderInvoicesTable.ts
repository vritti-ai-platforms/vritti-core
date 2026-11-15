import { useQuery } from '@tanstack/react-query';
import { SITE_PURCHASE_ORDERS } from '@vritti/commerce-permissions/purchase-orders';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { SupplierInvoicesTableResponse } from '@/schemas/supplier-invoices';
import { getPurchaseOrderInvoicesTable } from '@/services/site/supplier-invoices.service';
import { SITE_PURCHASE_ORDER_INVOICES_TABLE_KEY } from './keys';

// Fetches the invoices on a purchase order; self-gates on the order invoices view permission
export function usePurchaseOrderInvoicesTable(purchaseOrderId: string) {
  const { available } = usePermission(SITE_PURCHASE_ORDERS.invoices.view);
  return useQuery<SupplierInvoicesTableResponse, AxiosError>({
    queryKey: SITE_PURCHASE_ORDER_INVOICES_TABLE_KEY(purchaseOrderId),
    queryFn: () => getPurchaseOrderInvoicesTable(purchaseOrderId),
    enabled: available,
  });
}
