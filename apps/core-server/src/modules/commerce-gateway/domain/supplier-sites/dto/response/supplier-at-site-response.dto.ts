import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SiteSupplierResponseDto } from './site-supplier-response.dto';

export class SupplierAtSiteResponseDto extends SiteSupplierResponseDto {
  @ApiProperty({ description: 'Site the enrollment belongs to' })
  siteId: string;

  @ApiPropertyOptional({ description: 'Site name (gateway-enriched)', nullable: true })
  siteName: string | null;

  @ApiPropertyOptional({ description: 'Site code (gateway-enriched)', nullable: true })
  siteCode: string | null;
}
