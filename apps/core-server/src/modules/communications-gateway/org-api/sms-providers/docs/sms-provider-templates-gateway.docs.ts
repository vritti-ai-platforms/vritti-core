import { AddSmsProviderTemplateDto } from '@communications/sms-provider-templates/dto/request/add-sms-provider-template.dto';
import { SmsProviderTemplateResponseDto } from '@communications/sms-provider-templates/dto/response/sms-provider-template-response.dto';
import { SmsProviderTemplateTableResponseDto } from '@communications/sms-provider-templates/dto/response/sms-provider-template-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

export function ApiGetSmsProviderTemplates() {
  return applyDecorators(
    ApiOperation({
      summary: "List a provider's templates",
      description:
        'Returns the templates registered in Vritti against this provider. MSG91 offers no endpoint that lists the SMS templates on an account, so these rows are the list — each was confirmed with the vendor when it was added.',
    }),
    ApiParam({ name: 'id', description: 'SMS provider ID' }),
    ApiResponse({ status: 200, description: 'Templates retrieved.', type: SmsProviderTemplateTableResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiAddSmsProviderTemplate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register a template against a provider',
      description:
        "Reads the template from the vendor with the provider's stored credentials and records it only if it exists. This is also the first real proof that the stored auth key works.",
    }),
    ApiParam({ name: 'id', description: 'SMS provider ID' }),
    ApiBody({ type: AddSmsProviderTemplateDto }),
    ApiResponse({ status: 201, description: 'Template added.', type: CreateResponseDto }),
    ApiResponse({ status: 400, description: 'The vendor rejected the template ID or the stored credentials.' }),
    ApiResponse({ status: 409, description: 'Template already registered against this provider.' }),
  );
}

export function ApiRefreshSmsProviderTemplate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Re-read a template from the vendor',
      description: 'Replaces the stored snapshot, so a template edited in the MSG91 panel stops being stale here.',
    }),
    ApiParam({ name: 'id', description: 'SMS provider ID' }),
    ApiParam({ name: 'templateId', description: 'Vritti template row ID' }),
    ApiResponse({ status: 200, description: 'Template refreshed.', type: SmsProviderTemplateResponseDto }),
    ApiResponse({ status: 404, description: 'Template not found.' }),
  );
}

export function ApiDeleteSmsProviderTemplate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a template from Vritti',
      description: 'Forgets the row. The template itself is untouched in MSG91.',
    }),
    ApiParam({ name: 'id', description: 'SMS provider ID' }),
    ApiParam({ name: 'templateId', description: 'Vritti template row ID' }),
    ApiResponse({ status: 200, description: 'Template removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Template not found.' }),
  );
}
