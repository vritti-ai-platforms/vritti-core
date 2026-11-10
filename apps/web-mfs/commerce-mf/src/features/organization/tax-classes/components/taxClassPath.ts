import { buildSlug } from '@vritti/quantum-ui/slug';

export type TaxClassTab = 'overview' | 'groups';

// The tax class detail page's path relative to the tax classes list, opened on one tab
export function taxClassPath(taxClass: { id: string; name: string }, tab: TaxClassTab): string {
  return `${buildSlug(taxClass.name, taxClass.id)}/${tab}`;
}
