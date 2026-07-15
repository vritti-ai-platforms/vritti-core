export const SITE_GROUP_COLOR_KEYS = [
  'blue',
  'green',
  'amber',
  'rose',
  'violet',
  'teal',
  'orange',
  'lime',
  'cyan',
  'indigo',
  'fuchsia',
  'slate',
] as const;

export type SiteGroupColorKey = (typeof SITE_GROUP_COLOR_KEYS)[number];
