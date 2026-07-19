import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddSupplierItemSiteDto {
  @ApiProperty({ description: 'Site ID the override applies to' })
  @IsUUID()
  @IsNotEmpty()
  siteId: string;

  @ApiPropertyOptional({ description: 'Site-specific lead time in days', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Site-specific minimum order quantity', example: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minOrderQuantity?: number;
}
