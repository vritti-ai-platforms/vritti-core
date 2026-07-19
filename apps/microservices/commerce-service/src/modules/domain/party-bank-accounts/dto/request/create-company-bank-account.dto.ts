import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCompanyBankAccountDto {
  @IsUUID()
  companyId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  accountName: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountNumber: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ifscCode?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  upiId?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankName?: string | null;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
