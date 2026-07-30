import { axios } from '@vritti/quantum-ui/axios';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { OrganizationData, OrganizationStatusResponse } from '@/schemas/organization';

// Returns whether the git organization exists, plus the namespace it occupies either way
export function getOrganizationStatus(): Promise<OrganizationStatusResponse> {
  return axios.get<OrganizationStatusResponse>('gitea-api/organization').then((r) => r.data);
}

// Provisions the git organization. Sends no body — the server derives every field from the
// Vritti organization record.
export function createOrganization(): Promise<CreateResponse<OrganizationData>> {
  return axios.post<CreateResponse<OrganizationData>>('gitea-api/organization').then((r) => r.data);
}
