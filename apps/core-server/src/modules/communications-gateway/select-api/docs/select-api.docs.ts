import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiWhatsappAccountsSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'WhatsApp account options',
      description: 'Paginated account options for select dropdowns (e.g. the breadcrumb switcher).',
    }),
    ApiResponse({ status: 200, description: 'Options retrieved.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}
