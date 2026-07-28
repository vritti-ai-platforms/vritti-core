// The git organisation is provisioned entirely from the Vritti organization record — the client
// sends no fields at all, so there is no form schema here.

export interface OrganisationData {
  id: number;
  namespace: string;
  fullName: string;
  description: string;
  website: string;
  location: string;
  visibility: string;
  avatarUrl: string;
}

// `namespace` is always present so the empty state can name the namespace it will create;
// `organisation` is null until it has been provisioned.
export interface OrganisationStatusResponse {
  exists: boolean;
  namespace: string;
  // Wire field is `organization` — matches the backend DTO exactly
  organization: OrganisationData | null;
}
