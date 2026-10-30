export const FIELD_PERMISSION_KEY = 'field_permission';

export type FieldPermissionCondition = (value: unknown, payload: Record<string, unknown>) => boolean;

export interface FieldPermissionRule {
  codes: readonly string[];
  when: FieldPermissionCondition;
}

export type FieldPermissions = Record<string, FieldPermissionRule>;

const isUsed: FieldPermissionCondition = (value) => value !== undefined && value !== null && value !== false;

// Marks a request DTO / GraphQL input field as requiring every given code whenever `when` holds for the raw request
// value (default: the field is sent and is not null or false). `when` runs before validation, so it sees raw values.
export const FieldPermission =
  (codes: readonly string[], when: FieldPermissionCondition = isUsed): PropertyDecorator =>
  (target, propertyKey) => {
    const inherited: FieldPermissions = Reflect.getMetadata(FIELD_PERMISSION_KEY, target.constructor) ?? {};
    Reflect.defineMetadata(
      FIELD_PERMISSION_KEY,
      { ...inherited, [String(propertyKey)]: { codes, when } },
      target.constructor,
    );
  };

// The gated fields of a DTO class, including those declared on its parents
export const getFieldPermissions = (dtoClass: unknown): FieldPermissions | undefined =>
  typeof dtoClass === 'function' ? Reflect.getMetadata(FIELD_PERMISSION_KEY, dtoClass) : undefined;
