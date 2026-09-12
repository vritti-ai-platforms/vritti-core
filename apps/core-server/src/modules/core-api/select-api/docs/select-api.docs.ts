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
