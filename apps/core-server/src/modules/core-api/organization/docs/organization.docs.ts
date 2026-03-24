import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrganizationDto } from '../dto/entity/organization.dto';
import { CreateOrganizationWebhookDto } from '../dto/request/create-organization-webhook.dto';

export function ApiCreateOrganizationWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create organization from webhook',
      description:
        'Receives an organization creation event from cloud-server. Requires X-Webhook-Secret header for authentication.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiBody({ type: CreateOrganizationWebhookDto }),
    ApiResponse({ status: 201, description: 'Organization created successfully.', type: OrganizationDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or validation error.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}
