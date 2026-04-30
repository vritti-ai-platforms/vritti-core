import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';

export class TerminalPriceListAssignmentDto {
  @ApiProperty({ description: 'Price list ID' })
  @IsUUID()
  priceListId: string;

  @ApiPropertyOptional({ description: 'Priority order for price list merge', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ description: 'Whether this assignment is default', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDefault?: boolean;
}

export class SaveTerminalPriceListsDto {
  @ApiProperty({ type: [TerminalPriceListAssignmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TerminalPriceListAssignmentDto)
  priceLists: TerminalPriceListAssignmentDto[];
}
