import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsOptional, IsUUID } from 'class-validator';

export class SupplierItemsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Restrict options to items linked to this supplier' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Exclude items already on this purchase order' })
  @IsOptional()
  @IsUUID()
  excludeOnPurchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'Exclude items already on this goods receipt' })
  @IsOptional()
  @IsUUID()
  excludeOnGoodsReceiptId?: string;
}
