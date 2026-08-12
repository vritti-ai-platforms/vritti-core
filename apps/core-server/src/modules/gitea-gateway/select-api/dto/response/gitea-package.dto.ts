// Raw package shape returned by the Gitea package registry API (GET /packages/{owner}). snake_case
// mirrors the wire format. Gitea returns one entry per package VERSION, so the same `name` recurs
// across entries that differ only by `version` — callers collapse by name (packages) or by version
// (tags). Only the fields this gateway reads are declared.
export interface GiteaApiPackage {
  id: number;
  type: string;
  name: string;
  version: string;
  html_url: string;
  created_at: string;
}
