import { ApiProperty } from '@nestjs/swagger';

export class RequestedPurchaseQuotationResponseDto {
  @ApiProperty({ description: 'The draft supplier quotation created for the purchase' })
  quotationId: string;
}
