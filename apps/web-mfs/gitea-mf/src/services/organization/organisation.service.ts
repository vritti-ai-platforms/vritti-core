import { axios } from '@vritti/quantum-ui/axios';
import type { CreateResponse } from '@/schemas/common';
import type { OrganisationData, OrganisationStatusResponse } from '@/schemas/organisation';

// Returns whether the git organisation exists, plus the namespace it occupies either way
export function getOrganisationStatus(): Promise<OrganisationStatusResponse> {
  return axios.get<OrganisationStatusResponse>('gitea-api/organization').then((r) => r.data);
}

// Provisions the git organisation. Sends no body — the server derives every field from the
// Vritti organization record.
export function createOrganisation(): Promise<CreateResponse<OrganisationData>> {
  return axios.post<CreateResponse<OrganisationData>>('gitea-api/organization').then((r) => r.data);
}
