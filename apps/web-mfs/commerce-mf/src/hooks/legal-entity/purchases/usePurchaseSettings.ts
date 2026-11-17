import { useQuery } from '@tanstack/react-query';
import { LE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseSettingsRow } from '@/schemas/purchases';
import { getPurchaseSettings } from '@/services/legal-entity/purchases.service';
import { PURCHASE_SETTINGS_KEY } from './keys';

// Fetches every site of the legal entity with its purchasing rules; self-gates on the settings view permission
export function usePurchaseSettings() {
  const { available } = usePermission(LE_PURCHASES.settings.view);
  return useQuery<PurchaseSettingsRow[], AxiosError>({
    queryKey: PURCHASE_SETTINGS_KEY,
    queryFn: getPurchaseSettings,
    enabled: available,
  });
}
