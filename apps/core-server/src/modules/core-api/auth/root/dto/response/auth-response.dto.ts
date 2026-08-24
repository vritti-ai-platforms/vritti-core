import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type ServiceType, ServiceTypeValues } from '@/db/schema';
import { AssignedLegalEntityResponseDto } from '../../../../user-permissions/dto/response/assigned-legal-entity-response.dto';
import { AssignedRoleResponseDto } from '../../../../user-permissions/dto/response/assigned-role-response.dto';
import { AssignedSiteGroupResponseDto } from '../../../../user-permissions/dto/response/assigned-site-group-response.dto';
import { AssignedSiteResponseDto } from '../../../../user-permissions/dto/response/assigned-site-response.dto';
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

export class AuthOrgServiceDto {
  @ApiProperty({ enum: ServiceTypeValues, example: 'GITEA' }) service: ServiceType;
  @ApiPropertyOptional({ description: "The provider's own id", nullable: true }) externalId: string | null;
  @ApiPropertyOptional({ description: "The provider's namespace/name", nullable: true }) externalName: string | null;
}

export class AuthOrgDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() subdomain: string;
  @ApiPropertyOptional() logoLightUrl: string | null;
  @ApiPropertyOptional() logoDarkUrl: string | null;
  // Provisioned external services — clients gate service-dependent screens on this instead of calling the provider
  @ApiProperty({ type: [AuthOrgServiceDto] }) services: AuthOrgServiceDto[];
}

export class AuthResponseDto {
  @ApiPropertyOptional() accessToken?: string;
  @ApiPropertyOptional() expiresIn?: number;
  @ApiPropertyOptional() requiresSetPassword?: boolean;
  @ApiPropertyOptional() isAuthenticated?: boolean;
  @ApiPropertyOptional() sessionId?: string;
  @ApiPropertyOptional({ type: AuthUserDto }) user?: AuthUserDto;
  @ApiPropertyOptional({ type: AuthOrgDto }) org?: AuthOrgDto;
  @ApiPropertyOptional({ type: [AssignedSiteResponseDto] }) sites?: AssignedSiteResponseDto[];
  @ApiPropertyOptional({ type: [AssignedLegalEntityResponseDto] })
  legalEntities?: AssignedLegalEntityResponseDto[];
  @ApiPropertyOptional({ type: [AssignedSiteGroupResponseDto] })
  siteGroups?: AssignedSiteGroupResponseDto[];
  @ApiPropertyOptional({ type: [AssignedRoleResponseDto] })
  assignments?: AssignedRoleResponseDto[];
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { $ref: '#/components/schemas/PermissionFeatureDto' },
    },
  })
  featuresBySiteId?: Record<string, PermissionFeatureDto[]>;
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { $ref: '#/components/schemas/PermissionFeatureDto' },
    },
  })
  featuresByGroupId?: Record<string, PermissionFeatureDto[]>;
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { $ref: '#/components/schemas/PermissionFeatureDto' },
    },
  })
  featuresByLeId?: Record<string, PermissionFeatureDto[]>;
  @ApiPropertyOptional({ type: [PermissionFeatureDto] })
  orgFeatures?: PermissionFeatureDto[];

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
