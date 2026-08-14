// The git organization is provisioned entirely from the Vritti organization record — the client
// sends no fields at all, so there is no form schema here.

export interface OrganizationData {
  id: number;
  namespace: string;
  // Null when unset in Gitea — DetailField renders null as its placeholder, so nothing coerces to ''
  fullName: string | null;
  description: string | null;
  website: string | null;
  location: string | null;
  visibility: string;
  avatarUrl: string | null;
}

// `namespace` is always present so the empty state can name the namespace it will create;
// `organization` is null until it has been provisioned.
export interface OrganizationStatusResponse {
  exists: boolean;
  namespace: string;
  // Wire field is `organization` — matches the backend DTO exactly
  organization: OrganizationData | null;
}
