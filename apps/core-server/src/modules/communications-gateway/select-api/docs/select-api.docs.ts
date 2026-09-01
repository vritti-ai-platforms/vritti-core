import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiSmsProvidersSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'SMS provider options',
      description: "Paginated provider options — the organization's own rows plus Vritti's platform rows.",
    }),
    ApiResponse({ status: 200, description: 'Options retrieved.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

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
