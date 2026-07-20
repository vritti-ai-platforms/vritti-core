import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePartyBankAccountDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Account holder name', example: 'Priya Sharma' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  accountName: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Bank account number', example: '50100123456789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountNumber: string;

  @Trim()
  @ApiPropertyOptional({ description: 'IFSC code', example: 'HDFC0001234', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ifscCode?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'UPI ID', example: 'priya@hdfcbank', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  upiId?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Bank name', example: 'HDFC Bank', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankName?: string | null;

  @ApiPropertyOptional({ description: 'Whether this is the primary account for the party' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Whether the account is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
