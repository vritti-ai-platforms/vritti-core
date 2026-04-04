import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MobileLookupOrganizationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Acme Corp' })
  name: string;

  @ApiProperty({ example: 'acme' })
  subdomain: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  logoUrl: string | null;
}

export class MobileLookupResponseDto {
  @ApiProperty({ type: [MobileLookupOrganizationDto] })
  organizations: MobileLookupOrganizationDto[];
}
