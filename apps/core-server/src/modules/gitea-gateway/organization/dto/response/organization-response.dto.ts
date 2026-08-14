import { ApiProperty } from '@nestjs/swagger';

// Raw organization shape returned by the Gitea REST API — snake_case mirrors the wire format.
// Kept beside the DTO that maps it so the two stay in step.
export interface GiteaApiOrganization {
  id: number;
  username: string;
  // Gitea sends these as null when unset, not as empty strings
  full_name: string | null;
  description: string | null;
  website: string | null;
  location: string | null;
  visibility: string;
  avatar_url: string | null;
}

export class OrganizationResponseDto {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ description: 'Git namespace — derived from the Vritti subdomain', example: 'wine-mart' })
  namespace: string;

  @ApiProperty({ example: 'Wine Mart', nullable: true })
  fullName: string | null;

  @ApiProperty({ example: 'Retail systems', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'https://winemart.example.com', nullable: true })
  website: string | null;

  @ApiProperty({ example: 'Bengaluru, India', nullable: true })
  location: string | null;

  @ApiProperty({ example: 'private' })
  visibility: string;

  @ApiProperty({ example: 'http://localhost:3300/avatars/032acb4a', nullable: true })
  avatarUrl: string | null;

  // Creates a DTO from a raw Gitea organization payload
  static from(organization: GiteaApiOrganization): OrganizationResponseDto {
    const dto = new OrganizationResponseDto();
    dto.id = organization.id;
    dto.namespace = organization.username;
    // Unset fields stay null rather than collapsing to '' — an empty string reads as a present-but-blank
    // value to every consumer, where null is the absence the UI already renders as a placeholder
    dto.fullName = organization.full_name;
    dto.description = organization.description;
    dto.website = organization.website;
    dto.location = organization.location;
    dto.visibility = organization.visibility;
    dto.avatarUrl = organization.avatar_url;
    return dto;
  }
}
