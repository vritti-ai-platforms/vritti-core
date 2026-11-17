import { useQuery } from '@tanstack/react-query';
import { SITE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseSettings } from '@/schemas/purchases';
import { getPurchaseSettings } from '@/services/site/purchases.service';
import { PURCHASE_SETTINGS_KEY } from './keys';

// Fetches the purchasing rules the legal entity set for the session site; self-gates on the view permission
export function usePurchaseSettings() {
  const { available } = usePermission(SITE_PURCHASES.view);
  return useQuery<PurchaseSettings, AxiosError>({
    queryKey: PURCHASE_SETTINGS_KEY,
    queryFn: getPurchaseSettings,
    enabled: available,
  });
}
