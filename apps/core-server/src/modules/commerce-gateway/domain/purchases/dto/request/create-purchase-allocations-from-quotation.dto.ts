import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class CreatePurchaseAllocationsFromQuotationDto {
  @ApiPropertyOptional({
    description: 'A posted quotation of the purchase; every line quoting one of its items is allocated',
  })
  @IsOptional()
  @IsUUID('7')
  supplierQuotationId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Posted quotation lines to allocate the items from, when no quotation is named',
  })
  @ValidateIf((dto: CreatePurchaseAllocationsFromQuotationDto) => !dto.supplierQuotationId)
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('7', { each: true })
  supplierQuotationItemIds?: string[];
}
