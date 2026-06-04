import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateCreditNoteDto {
  @ApiProperty({ description: 'Credit note type', enum: ['PAYABLE', 'RECEIVABLE'], example: 'PAYABLE' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Party type', enum: ['SUPPLIER', 'CUSTOMER', 'AGGREGATOR'], example: 'SUPPLIER' })
  @IsString()
  @IsNotEmpty()
  partyType: string;

  @ApiPropertyOptional({ description: 'Party entity ID' })
  @IsOptional()
  @IsUUID()
  partyId?: string;

  @ApiProperty({ description: 'Party display name', example: 'Acme Foods Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  partyName: string;

  @ApiProperty({ description: 'Unique credit note number', example: 'CN-2026-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  creditNoteNumber: string;

  @ApiProperty({ description: 'Credit note amount', example: 2500.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Reason for credit note' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Initial status override', enum: ['DRAFT', 'ISSUED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'User ID of issuer' })
  @IsOptional()
  @IsUUID()
  issuedBy?: string;
}
