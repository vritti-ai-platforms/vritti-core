// Shared permission types. BUs + features are delivered via the SSE /auth/status stream
// (see AuthProvider), not via dedicated REST endpoints.

import type { PermissionFeature } from '@vritti/quantum-ui/types/catalog-resolver';

export interface PermissionsResponse {
  features: PermissionFeature[];
}

export interface AssignedBU {
  id: string;
  name: string;
  code: string | null;
  type: string;
  timezone: string;
  currencyCode: string;
}
