// Shortens a site UUID for display — there is no site-name endpoint at group scope
export function shortSiteId(siteId: string): string {
  return siteId.length > 8 ? siteId.slice(0, 8) : siteId;
}
