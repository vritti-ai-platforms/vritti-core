import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfileDto } from '../dto/entity/profile.dto';

export function ApiGetProfile() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get user profile',
      description:
        'Returns the authenticated user profile information. Profile changes must be requested through the admin.',
    }),
    ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: ProfileDto }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication' }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}
