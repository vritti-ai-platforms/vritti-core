import { CreateWhatsappTemplateDto } from '@communications/whatsapp-account-templates/dto/request/create-whatsapp-template.dto';
import { TemplateLibraryItemResponseDto } from '@communications/whatsapp-account-templates/dto/response/template-library-item-response.dto';
import { WhatsappTemplateTableResponseDto } from '@communications/whatsapp-account-templates/dto/response/whatsapp-template-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

export function ApiGetWhatsappTemplatesTable() {
  return applyDecorators(
    ApiOperation({
      summary: "Get the WABA's message templates table",
      description:
        'Reads the templates live from Meta (one row per name and language pair) — review status and quality are always current.',
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiResponse({ status: 200, description: 'Templates retrieved.', type: WhatsappTemplateTableResponseDto }),
    ApiResponse({ status: 404, description: 'WhatsApp account not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetWhatsappTemplateLibrary() {
  return applyDecorators(
    ApiOperation({
      summary: "Browse Meta's template library",
      description: 'Pre-written, pre-approved templates — creating from one usually skips Meta review.',
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiQuery({ name: 'search', required: false }),
    ApiQuery({ name: 'topic', required: false }),
    ApiQuery({ name: 'language', required: false }),
    ApiQuery({ name: 'category', required: false }),
    ApiResponse({ status: 200, description: 'Library entries retrieved.', type: [TemplateLibraryItemResponseDto] }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetWhatsappTemplateLanguages() {
  return applyDecorators(
    ApiOperation({
      summary: 'List template languages',
      description: "Distinct languages Meta's template library ships in — feeds the language selector.",
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiResponse({ status: 200, description: 'Languages retrieved.', type: [String] }),
  );
}

export function ApiCreateWhatsappTemplate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a message template',
      description:
        'Custom components go through Meta review; a library reference is pre-approved content and usually approves instantly.',
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiBody({ type: CreateWhatsappTemplateDto }),
    ApiResponse({ status: 201, description: 'Template submitted.', type: CreateResponseDto }),
    ApiResponse({ status: 400, description: 'Meta rejected the template payload.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteWhatsappTemplate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a message template',
      description:
        'Removes the name+language node matching the template ID. Meta blocks reusing a deleted template name for 30 days.',
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiParam({ name: 'templateId', description: 'Meta template ID' }),
    ApiQuery({ name: 'name', description: 'Template name — Meta requires it alongside the ID' }),
    ApiResponse({ status: 200, description: 'Template deleted.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Meta rejected the delete.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}
