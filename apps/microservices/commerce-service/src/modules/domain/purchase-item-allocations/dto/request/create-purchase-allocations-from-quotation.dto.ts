import { ArrayMinSize, IsArray, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class CreatePurchaseAllocationsFromQuotationDto {
  @IsUUID('7')
  id: string;

  // Every line of this quotation that quotes an item of the purchase; used when no lines are named
  @IsOptional()
  @IsUUID('7')
  supplierQuotationId?: string;

  @ValidateIf((dto: CreatePurchaseAllocationsFromQuotationDto) => !dto.supplierQuotationId)
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('7', { each: true })
  supplierQuotationItemIds?: string[];
}
