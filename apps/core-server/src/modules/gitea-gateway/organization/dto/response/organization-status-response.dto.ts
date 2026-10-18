import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationResponseDto } from './organization-response.dto';

export class OrganizationStatusResponseDto {
  @ApiProperty({ example: false, description: 'Whether the git namespace has been created yet' })
  exists: boolean;

  @ApiProperty({ description: 'The namespace this organization will occupy', example: 'wine-mart' })
  namespace: string;

  @ApiPropertyOptional({ type: OrganizationResponseDto, nullable: true })
  organization: OrganizationResponseDto | null;

  // Builds the status for a namespace that has not been provisioned yet
  static absent(namespace: string): OrganizationStatusResponseDto {
    const dto = new OrganizationStatusResponseDto();
    dto.exists = false;
    dto.namespace = namespace;
    dto.organization = null;
    return dto;
  }

  // Builds the status for an existing namespace
  static present(namespace: string, organization: OrganizationResponseDto): OrganizationStatusResponseDto {
    const dto = new OrganizationStatusResponseDto();
    dto.exists = true;
    dto.namespace = namespace;
    dto.organization = organization;
    return dto;
  }
}
