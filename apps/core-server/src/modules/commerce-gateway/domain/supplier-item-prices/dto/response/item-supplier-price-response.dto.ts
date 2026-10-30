import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupplierItemPriceResponseDto } from './supplier-item-price-response.dto';

export class ItemSupplierPriceResponseDto extends SupplierItemPriceResponseDto {
  @ApiProperty({ description: 'Supplier that quoted the price' })
  supplierId: string;

  @ApiProperty({ description: 'Display name of the supplier' })
  supplierName: string;

  @ApiProperty({ description: 'Code of the supplier' })
  supplierCode: string;

  @ApiPropertyOptional({ description: 'Unit the price is per', nullable: true })
  uomSymbol: string | null;
}
