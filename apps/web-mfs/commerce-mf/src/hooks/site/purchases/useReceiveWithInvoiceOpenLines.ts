import { useQuery } from '@tanstack/react-query';
import { SITE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { ReceiveWithInvoiceOpenLine, ReceiveWithInvoiceOpenLinesQuery } from '@/schemas/receive-with-invoices';
import { getReceiveWithInvoiceOpenLines } from '@/services/site/purchases.service';
import { RECEIVE_WITH_INVOICE_OPEN_LINES_KEY } from './keys';

// Fetches the supplier's allocations open to a Receive with Invoice; self-gates on the view permission
export function useReceiveWithInvoiceOpenLines({ supplierId, excludeInvoiceId }: ReceiveWithInvoiceOpenLinesQuery) {
  const { available } = usePermission(SITE_PURCHASES.view);
  const params = { supplierId: supplierId ?? '', excludeInvoiceId };
  return useQuery<ReceiveWithInvoiceOpenLine[], AxiosError>({
    queryKey: RECEIVE_WITH_INVOICE_OPEN_LINES_KEY(params),
    queryFn: () => getReceiveWithInvoiceOpenLines(params),
    enabled: !!supplierId && available,
  });
}
