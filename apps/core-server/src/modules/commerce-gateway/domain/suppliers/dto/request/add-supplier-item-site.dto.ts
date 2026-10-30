import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class AddSupplierItemSiteDto {
  @ApiProperty({ description: 'Enrolled site to set the item up at' })
  @IsUUID('7')
  @IsNotEmpty()
  siteId: string;

  @ApiPropertyOptional({
    description: 'Whether this is the preferred supplier for the item at the site',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  @ApiPropertyOptional({ description: 'Site-specific lead time in days', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;
}
