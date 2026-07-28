import { ApiProperty } from '@nestjs/swagger';

// Raw organization shape returned by the Gitea REST API — snake_case mirrors the wire format.
// Kept beside the DTO that maps it so the two stay in step.
export interface GiteaApiOrganization {
  id: number;
  username: string;
  full_name: string;
  description: string;
  website: string;
  location: string;
  visibility: string;
  avatar_url: string;
}

export class OrganizationResponseDto {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ description: 'Git namespace — derived from the Vritti subdomain', example: 'wine-mart' })
  namespace: string;

  @ApiProperty({ example: 'Wine Mart' })
  fullName: string;

  @ApiProperty({ example: 'Retail systems' })
  description: string;

  @ApiProperty({ example: 'https://winemart.example.com' })
  website: string;

  @ApiProperty({ example: 'Bengaluru, India' })
  location: string;

  @ApiProperty({ example: 'private' })
  visibility: string;

  @ApiProperty({ example: 'http://localhost:3300/avatars/032acb4a' })
  avatarUrl: string;

  // Creates a DTO from a raw Gitea organization payload
  static from(organization: GiteaApiOrganization): OrganizationResponseDto {
    const dto = new OrganizationResponseDto();
    dto.id = organization.id;
    dto.namespace = organization.username;
    dto.fullName = organization.full_name ?? '';
    dto.description = organization.description ?? '';
    dto.website = organization.website ?? '';
    dto.location = organization.location ?? '';
    dto.visibility = organization.visibility;
    dto.avatarUrl = organization.avatar_url ?? '';
    return dto;
  }
}
