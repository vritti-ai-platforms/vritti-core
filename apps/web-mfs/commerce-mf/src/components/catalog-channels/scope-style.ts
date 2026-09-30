import type { ChannelOwnerScope } from '@/schemas/catalog-channels';

/**
 * Colour encodes WHERE a catalog is assigned — organization neutral, company amber, outlet green.
 *
 * Written as whole literals because Tailwind scans source text: core-web's `@source` covers
 * `web-mfs/*​/src`, so a class only survives the build if it appears here spelled out.
 */
export const SCOPE_EDGE: Record<ChannelOwnerScope, string> = {
  ORG: 'border-muted-foreground/40',
  LE: 'border-group-amber',
  SITE: 'border-group-green',
};

export const SCOPE_TINT: Record<ChannelOwnerScope, string> = {
  ORG: '',
  LE: 'bg-group-amber/10',
  SITE: 'bg-group-green/10',
};

export const SCOPE_DOT: Record<ChannelOwnerScope, string> = {
  ORG: 'bg-muted-foreground/40',
  LE: 'bg-group-amber',
  SITE: 'bg-group-green',
};
