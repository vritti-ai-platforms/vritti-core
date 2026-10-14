import { BadRequestException } from '@vritti/api-sdk/exceptions';

// Parses one serialized piece of table view state, naming the query field when it is not JSON
export function parseTableQueryParam<T>(raw: string | undefined, field: string, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new BadRequestException({
      label: 'Invalid Table Query',
      detail: 'The table view state could not be read.',
      errors: [{ field, message: 'Must be JSON' }],
    });
  }
}
