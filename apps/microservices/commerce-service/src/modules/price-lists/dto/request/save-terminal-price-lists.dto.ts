import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';

export class TerminalPriceListAssignmentDto {
  @IsUUID()
  priceListId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class SaveTerminalPriceListsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TerminalPriceListAssignmentDto)
  priceLists: TerminalPriceListAssignmentDto[];
}
