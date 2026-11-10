import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class ReceivablePurchaseOrdersSelectQueryDto extends SelectOptionsQueryDto {
  @ApiProperty({ description: 'Supplier whose confirmed or partially received purchase orders are listed.' })
  @IsUUID('7')
  supplierId: string;

  @ApiPropertyOptional({
    description: 'Goods receipt being added to: narrows to its site and leaves out the purchase orders already on it.',
  })
  @IsOptional()
  @IsUUID('7')
  goodsReceiptId?: string;
}
