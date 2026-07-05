import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSION_KEY = 'require_permission';

// Marks a route as requiring the given enabled-permission code (e.g. 'uom.create')
export const RequirePermission = (code: string) => SetMetadata(REQUIRE_PERMISSION_KEY, code);
