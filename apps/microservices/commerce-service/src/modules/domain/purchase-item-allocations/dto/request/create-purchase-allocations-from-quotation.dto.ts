import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class CreatePurchaseAllocationsFromQuotationDto {
  @IsUUID('7')
  id: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('7', { each: true })
  supplierQuotationItemIds: string[];
}
