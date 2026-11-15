import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class InvoiceableGoodsReceiptsQueryDto {
  @ApiPropertyOptional({ description: 'Narrows to the receipts of one purchase order' })
  @IsOptional()
  @IsUUID('7')
  purchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'Invoice line being edited; its own quantity counts as open' })
  @IsOptional()
  @IsUUID('7')
  excludeLineId?: string;
}
