import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class CreatePurchaseAllocationsFromQuotationDto {
  @ApiProperty({ type: [String], description: 'Posted quotation lines to allocate the items from' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('7', { each: true })
  supplierQuotationItemIds: string[];
}
