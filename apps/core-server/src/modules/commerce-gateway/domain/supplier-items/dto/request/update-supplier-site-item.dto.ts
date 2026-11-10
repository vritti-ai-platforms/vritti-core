import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min, ValidateIf } from 'class-validator';

export class UpdateSupplierSiteItemDto {
  @ApiPropertyOptional({ description: 'Whether this is the preferred supplier for the item at the site' })
  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  @ApiPropertyOptional({
    description: "Pins a lead time in whole days to this site instead of the supplier item's",
    minimum: 0,
    maximum: 365,
    example: 5,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(365)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: "Drops the site's own lead time and follows the supplier item's default again" })
  @IsOptional()
  @IsBoolean()
  followDefaultLeadTime?: boolean;
}
