import { ApiProperty } from '@nestjs/swagger';

export class PaymentTermCountsResponseDto {
  @ApiProperty({ description: 'Rules of the payment term', example: 3 })
  ruleCount: number;
}
