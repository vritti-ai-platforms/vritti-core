import { WhatsappTemplateTableResponseDto } from '@communications/whatsapp-account-templates/dto/response/whatsapp-template-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

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
