import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateBankAccountDto {
  @ApiProperty({ description: 'Owning legal entity ID', example: 'uuid-here' })
  @IsUUID()
  legalEntityId: string;

  @ApiPropertyOptional({ description: 'Display label for the account', example: 'Primary current account' })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string | null;

  @ApiProperty({ description: 'Name the account is held in', example: 'Acme Retail Pvt Ltd' })
  @Trim({ nullify: false })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  accountHolderName: string;

  @ApiProperty({ description: 'Account number (5-30 letters or digits)', example: '123456789012' })
  @Trim({ nullify: false })
  @IsString()
  @Matches(/^[A-Za-z0-9]{5,30}$/, { message: 'Enter a valid account number' })
  accountNumber: string;

  @ApiProperty({ description: 'IFSC code of the branch', example: 'HDFC0001234' })
  @Trim({ nullify: false })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Enter a valid IFSC code' })
  ifscCode: string;

  @ApiProperty({ description: 'Bank name', example: 'HDFC Bank' })
  @Trim({ nullify: false })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  bankName: string;

  @ApiPropertyOptional({ description: 'Branch name', example: 'MG Road, Bengaluru' })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  branchName?: string | null;
}
