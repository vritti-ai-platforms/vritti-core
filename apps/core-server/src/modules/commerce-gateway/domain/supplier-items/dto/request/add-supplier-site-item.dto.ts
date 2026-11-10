import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsUUID, Max, Min, ValidateIf } from 'class-validator';

export class AddSupplierSiteItemDto {
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

  @ApiPropertyOptional({
    description: "The site's own lead time in whole days; omit to follow the supplier item's default",
    minimum: 0,
    maximum: 365,
    example: 5,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(365)
  leadTimeDays?: number;
}
