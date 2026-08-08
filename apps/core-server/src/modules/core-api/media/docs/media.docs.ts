import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { MediaResponseDto, PresignedUrlResponseDto, PublicMediaResponseDto } from '../dto/response/media-response.dto';

export function ApiUploadMedia() {
  return applyDecorators(
    ApiOperation({
      summary: 'Upload a file',
      description:
        "Stores the file in the organization's own bucket. Replaces any existing file for the same entity, and " +
        'reuses storage when the organization has already stored an identical file.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } }),
    ApiQuery({ name: 'entityType', type: String, description: 'Entity kind the file belongs to' }),
    ApiQuery({ name: 'entityId', type: String, description: 'Identifier of the entity' }),
    ApiResponse({ status: 201, description: 'File uploaded.', type: MediaResponseDto }),
    ApiResponse({ status: 400, description: 'No file provided, unsupported type, or file too large.' }),
    ApiResponse({ status: 413, description: 'Organization has used its full storage allowance.' }),
  );
}

export function ApiUploadPublicMedia() {
  return applyDecorators(
    ApiOperation({
      summary: 'Upload a file publicly',
      description:
        "Stores the file in the organization's public bucket and returns a permanent URL. Use for assets rendered " +
        'in lists, where a presigned URL per object would cost an API round trip per image.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } }),
    ApiQuery({ name: 'entityType', type: String, description: 'Entity kind the file belongs to' }),
    ApiQuery({ name: 'entityId', type: String, description: 'Identifier of the entity' }),
    ApiResponse({ status: 201, description: 'File uploaded.', type: PublicMediaResponseDto }),
    ApiResponse({ status: 400, description: 'No file, unsupported type, or public access not enabled for this org.' }),
    ApiResponse({ status: 413, description: 'Organization has used its full storage allowance.' }),
  );
}

export function ApiGetMediaUrl() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a download URL', description: 'Returns a time-limited presigned URL for the file.' }),
    ApiParam({ name: 'id', type: String, description: 'Media ID' }),
    ApiResponse({ status: 200, description: 'URL generated.', type: PresignedUrlResponseDto }),
    ApiResponse({ status: 404, description: 'Media not found.' }),
  );
}

export function ApiDeleteMedia() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a file',
      description: 'Removes the record, and the stored object once no other record references it.',
    }),
    ApiParam({ name: 'id', type: String, description: 'Media ID' }),
    ApiResponse({ status: 204, description: 'File deleted.' }),
    ApiResponse({ status: 404, description: 'Media not found.' }),
  );
}
