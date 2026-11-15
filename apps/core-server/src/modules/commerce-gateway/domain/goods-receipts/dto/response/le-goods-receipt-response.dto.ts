import { ApiProperty } from '@nestjs/swagger';
import { GoodsReceiptResponseDto } from './goods-receipt-response.dto';

export class LeGoodsReceiptResponseDto extends GoodsReceiptResponseDto {
  @ApiProperty({ description: 'Site name (gateway-enriched, not sortable)' })
  siteName: string;

  @ApiProperty({ description: 'Site code (gateway-enriched, not sortable)' })
  siteCode: string;
}
