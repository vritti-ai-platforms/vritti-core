import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';

export class InventoryItemPricesTableQueryDto {
  @ApiPropertyOptional({ description: "Site to read the prices at; the item's default priced site when omitted" })
  @IsOptional()
  @IsUUID('7')
  site?: string;

  @ApiPropertyOptional({
    description: 'Day the prices in force are read on: YYYY-MM-DD, or yesterday / today / tomorrow; today when omitted',
    example: 'today',
  })
  @IsOptional()
  @Matches(/^(\d{4}-\d{2}-\d{2}|yesterday|today|tomorrow)$/, { message: 'asOf must be YYYY-MM-DD or a relative day' })
  asOf?: string;
}
