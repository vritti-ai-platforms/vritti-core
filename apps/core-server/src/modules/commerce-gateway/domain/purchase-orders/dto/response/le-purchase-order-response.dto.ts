import { ApiProperty } from '@nestjs/swagger';
import { PurchaseOrderResponseDto } from './purchase-order-response.dto';

export class LePurchaseOrderResponseDto extends PurchaseOrderResponseDto {
  @ApiProperty({ description: 'Site name (gateway-enriched, not sortable)' })
  siteName: string;

  @ApiProperty({ description: 'Site code (gateway-enriched, not sortable)' })
  siteCode: string;
}
