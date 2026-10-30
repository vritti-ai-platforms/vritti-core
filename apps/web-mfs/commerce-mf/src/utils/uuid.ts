const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A bare id segment (…/<uuid>) as opposed to a `name~uuid` slug
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
