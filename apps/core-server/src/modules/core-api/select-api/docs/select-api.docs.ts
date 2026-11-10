import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiSelectApps() {
  return applyDecorators(
    ApiOperation({
      summary: 'App options',
      description: 'Active, unrevoked API credentials this organization owns. Revoked apps drop out of the picker.',
    }),
    ApiResponse({ status: 200, description: 'Select options.' }),
  );
}

export function ApiSelectSites() {
  return applyDecorators(
    ApiOperation({
      summary: 'Site options',
      description:
        "The session legal entity's active sites, ordered by sort order. `ids` keeps only the given sites. `supplierId` (or `inventoryItemId`, for any supplier of that item) lists the sites enrolled at — `isActive` keeps only active enrollments of active suppliers — or, with `isEnrolled=false`, the sites with no enrollment yet.",
    }),
    ApiResponse({ status: 200, description: 'Select options.' }),
    ApiResponse({ status: 400, description: 'Enrollment filters without a supplier or item, or conflicting ones.' }),
  );
}
