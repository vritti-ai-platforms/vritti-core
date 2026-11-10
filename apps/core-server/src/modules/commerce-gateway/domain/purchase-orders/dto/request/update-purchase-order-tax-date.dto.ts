import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, Matches } from 'class-validator';

export class UpdatePurchaseOrderTaxDateDto {
  @ApiProperty({
    description: 'Date tax is determined on (YYYY-MM-DD); may be before the order date',
    example: '2026-04-10',
  })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'taxDate must be YYYY-MM-DD' })
  taxDate: string;
}
