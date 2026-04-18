import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignedBuResponseDto } from '../../../../user-permissions/dto/response/assigned-bu-response.dto';
import { PermissionFeatureDto } from '../../../../user-permissions/dto/response/permissions-response.dto';

export class AuthUserDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() fullName: string;
  @ApiProperty() status: string;
  @ApiProperty() hasPassword: boolean;
  @ApiProperty() locale: string;
  @ApiProperty() timezone: string;
  @ApiProperty() createdAt: string;
  @ApiPropertyOptional() lastLoginAt: string | null;
}

export class AuthOrgDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() subdomain: string;
  @ApiPropertyOptional() logoUrl: string | null;
}

export class AuthResponseDto {
  @ApiPropertyOptional() accessToken?: string;
  @ApiPropertyOptional() expiresIn?: number;
  @ApiPropertyOptional() requiresSetPassword?: boolean;
  @ApiPropertyOptional() isAuthenticated?: boolean;
  @ApiPropertyOptional() sessionId?: string;
  @ApiPropertyOptional({ type: AuthUserDto }) user?: AuthUserDto;
  @ApiPropertyOptional({ type: AuthOrgDto }) org?: AuthOrgDto;
  @ApiPropertyOptional({ type: [AssignedBuResponseDto] }) businessUnits?: AssignedBuResponseDto[];
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { $ref: '#/components/schemas/PermissionFeatureDto' },
    },
  })
  featuresByBuId?: Record<string, PermissionFeatureDto[]>;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
