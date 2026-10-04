import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class SupplierItemsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Restrict options to items linked to this supplier' })
  @IsOptional()
  @IsUUID('7')
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Exclude items already on this purchase order' })
  @IsOptional()
  @IsUUID('7')
  excludeOnPurchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'Exclude items already on this goods receipt' })
  @IsOptional()
  @IsUUID('7')
  excludeOnGoodsReceiptId?: string;
}
