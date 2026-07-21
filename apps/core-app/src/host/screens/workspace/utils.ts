import { COMMON_ICONS, type PlatformIconDescriptor } from '@vritti/quantum-ui-native/DynamicIcon';
import type { SiteType, WorkspaceKind } from '../../types/permissions';

// Human labels for the site-type badge.
export const SITE_TYPE_LABELS: Record<SiteType, string> = {
  OUTLET: 'Outlet',
  WAREHOUSE: 'Warehouse',
  PRODUCTION: 'Production',
};

// Scope icons — SF Symbol (iOS) + Material Symbol (Android) equivalents of the web's lucide icons.
// Sites vary by type (Store / Warehouse / Factory on web); groups/companies/org are fixed.
export const SITE_TYPE_ICON: Record<SiteType, PlatformIconDescriptor> = {
  OUTLET: { sfSymbol: 'storefront', materialSymbol: 'storefront' },
  WAREHOUSE: { sfSymbol: 'shippingbox.fill', materialSymbol: 'warehouse' },
  PRODUCTION: { sfSymbol: 'gearshape.2.fill', materialSymbol: 'factory' },
};

export const SCOPE_ICON: Record<Exclude<WorkspaceKind, 'site'>, PlatformIconDescriptor> = {
  group: { sfSymbol: 'point.3.connected.trianglepath.dotted', materialSymbol: 'hub' },
  le: { sfSymbol: 'building.columns.fill', materialSymbol: 'account_balance' },
  org: { sfSymbol: 'building.2.fill', materialSymbol: 'corporate_fare' },
};

export const CHEVRON_ICON = COMMON_ICONS.chevronRight;

// Header account button (opens the Account screen).
export const ACCOUNT_ICON: PlatformIconDescriptor = {
  sfSymbol: 'person.crop.circle',
  materialSymbol: 'account_circle',
};

export function iconForWorkspace(kind: WorkspaceKind, siteType?: SiteType): PlatformIconDescriptor {
  if (kind === 'site') return SITE_TYPE_ICON[siteType ?? 'OUTLET'];
  return SCOPE_ICON[kind];
}

// Per-scope accent classes: solid rail, tinted icon tile, icon/watermark text color.
export interface ScopeAccent {
  rail: string;
  tile: string;
  icon: string;
}

export const SCOPE_ACCENTS: Record<WorkspaceKind, ScopeAccent> = {
  site: { rail: 'bg-success', tile: 'bg-success/10', icon: 'text-success' },
  group: { rail: 'bg-primary', tile: 'bg-primary/10', icon: 'text-primary' },
  le: { rail: 'bg-warning', tile: 'bg-warning/10', icon: 'text-warning' },
  org: { rail: 'bg-foreground', tile: 'bg-foreground/10', icon: 'text-foreground' },
};

export function timeOfDayGreeting(hour: number): string {
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

export function firstNameOf(fullName?: string | null): string {
  return (fullName ?? '').trim().split(/\s+/)[0] ?? '';
}

export function plural(n: number, one: string, many?: string): string {
  return `${n} ${n === 1 ? one : (many ?? `${one}s`)}`;
}

export interface WorkspaceOverviewCounts {
  sites: number;
  groups: number;
  les: number;
  org: boolean;
}

type OverviewKind = keyof Omit<WorkspaceOverviewCounts, 'org'> | 'org';

// Per-kind copy keyed by kind (single source for lede + summary label) — replaces the screen's nested
// lede ternary chain and hand-built summary array. ORDER fixes the summary's display sequence.
const OVERVIEW_KINDS: Record<OverviewKind, { lede: string; label: (n: number) => string }> = {
  sites: { lede: 'Pick your site', label: (n) => plural(n, 'site') },
  groups: { lede: 'Pick a site group', label: (n) => plural(n, 'site group') },
  les: { lede: 'Pick a company', label: (n) => plural(n, 'company', 'companies') },
  org: { lede: 'Your workspace', label: () => 'organization' },
};
const OVERVIEW_ORDER: OverviewKind[] = ['sites', 'groups', 'les', 'org'];

// Hero copy for the workspace picker: the lede ("Where are you working today?" across kinds, the kind's
// own line when only one) and the "2 sites · 1 company · organization" summary.
export function workspaceOverview({ sites, groups, les, org }: WorkspaceOverviewCounts): {
  lede: string;
  summary: string;
} {
  const counts: Record<OverviewKind, number> = { sites, groups, les, org: org ? 1 : 0 };
  const present = OVERVIEW_ORDER.filter((kind) => counts[kind] > 0);
  const lede =
    present.length > 1
      ? 'Where are you working today?'
      : present.length === 1
        ? OVERVIEW_KINDS[present[0]].lede
        : 'Your workspace';
  const summary = present.map((kind) => OVERVIEW_KINDS[kind].label(counts[kind])).join(' · ');
  return { lede, summary };
}

// "GOOD MORNING, SHYAM" — time-of-day greeting with the user's uppercased first name when known.
export function greetingFor(hour: number, fullName?: string | null): string {
  const first = firstNameOf(fullName);
  return `${timeOfDayGreeting(hour)}${first ? `, ${first.toUpperCase()}` : ''}`;
}

// "₹ INR" — narrow currency symbol + ISO code, falling back to the bare code (matches the web page).
export function currencyLabel(code: string, locale?: string | null): string {
  try {
    const parts = new Intl.NumberFormat(locale ?? undefined, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    const symbol = parts.find((p) => p.type === 'currency')?.value;
    return symbol && symbol !== code ? `${symbol} ${code}` : code;
  } catch {
    return code;
  }
}

// ISO-3166 alpha-2 → regional-indicator emoji flag (e.g. "IN" → 🇮🇳); "" when not a 2-letter code.
export function countryFlag(country: string): string {
  if (!/^[A-Za-z]{2}$/.test(country)) return '';
  const cc = country.toUpperCase();
  return String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0)));
}

// Bare 24h clock in a site's IANA timezone (e.g. "16:42").
export function formatSiteTime(date: Date, timeZone: string, locale?: string | null): string {
  try {
    return new Intl.DateTimeFormat(locale ?? undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).format(date);
  } catch {
    return '–:–';
  }
}
