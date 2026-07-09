import { useQuery } from '@tanstack/react-query';
import { LOCATIONS } from '@vritti/commerce-permissions/locations';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { LocationTreeNode } from '@/schemas/locations';
import { listLocationTree } from '@/services/locations.service';
import { LOCATION_TREE_KEY } from './keys';

export function useLocationTree(search?: string) {
  // The tree endpoint is guarded by locations.view — self-gate so a locked/denied user never fires the request
  const { available } = usePermission(LOCATIONS.view);
  return useQuery<LocationTreeNode[], AxiosError>({
    queryKey: [...LOCATION_TREE_KEY, search ?? ''],
    queryFn: () => listLocationTree(search),
    enabled: available,
  });
}
