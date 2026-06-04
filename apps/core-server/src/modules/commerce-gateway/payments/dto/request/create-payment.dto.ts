import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Invoice to record payment against' })
  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ description: 'Payment amount', example: 5000.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payment method', enum: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET', 'ONLINE'], example: 'BANK_TRANSFER' })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiPropertyOptional({ description: 'Payment reference number', example: 'TXN-123456' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;

  @ApiPropertyOptional({ description: 'Payment status', enum: ['COMPLETED', 'FAILED', 'REFUNDED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
