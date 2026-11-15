import { ApiProperty } from '@nestjs/swagger';

export class CreatedPurchaseSupplierInvoiceResponseDto {
  @ApiProperty({ description: 'The draft supplier invoice created' })
  supplierInvoiceId: string;
}
