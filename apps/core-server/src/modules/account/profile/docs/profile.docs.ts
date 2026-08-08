import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfileDto } from '../dto/entity/profile.dto';
import { ProfilePhotoDto } from '../dto/response/profile-photo.dto';

export function ApiGetProfile() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get user profile',
      description:
        'Returns the authenticated user profile information. Other than the photo, profile changes must be requested through the admin.',
    }),
    ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: ProfileDto }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication' }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}

export function ApiUploadProfilePhoto() {
  return applyDecorators(
    ApiOperation({
      summary: 'Upload profile photo',
      description:
        "Stores the uploaded image in the organization's private bucket and returns a time-limited URL. Any previous photo is replaced.",
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] },
    }),
    ApiResponse({ status: 201, description: 'Photo uploaded successfully', type: ProfilePhotoDto }),
    ApiResponse({ status: 400, description: 'No file provided, unsupported type, or file too large' }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication' }),
    ApiResponse({ status: 413, description: 'Organization has used its full storage allowance' }),
  );
}

export function ApiRemoveProfilePhoto() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove profile photo',
      description: 'Deletes the profile photo. Succeeds even when no photo is set.',
    }),
    ApiResponse({ status: 204, description: 'Photo removed successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication' }),
  );
}
