import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment ID' })
  id: string;

  @ApiProperty({ description: 'Invoice ID' })
  invoiceId: string;

  @ApiProperty({ description: 'Payment amount' })
  amount: number;

  @ApiProperty({ description: 'Payment method', enum: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET', 'ONLINE'] })
  method: string;

  @ApiPropertyOptional({ description: 'Payment reference number', nullable: true })
  reference: string | null;

  @ApiProperty({ description: 'Payment status', enum: ['COMPLETED', 'FAILED', 'REFUNDED'] })
  status: string;

  @ApiProperty({ description: 'ISO timestamp of payment' })
  paidAt: string;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
