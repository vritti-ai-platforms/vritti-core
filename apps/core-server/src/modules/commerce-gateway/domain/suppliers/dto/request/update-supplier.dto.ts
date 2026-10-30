import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateSupplierDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Updated supplier code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @ApiPropertyOptional({ description: 'Payment term new site enrollments start from', nullable: true })
  @IsOptional()
  @IsUUID('7')
  defaultPaymentTermId?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Updated notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Block new purchase orders for this supplier' })
  @IsOptional()
  @IsBoolean()
  purchasingBlocked?: boolean;

  @ApiPropertyOptional({ description: 'Block payments to this supplier' })
  @IsOptional()
  @IsBoolean()
  paymentBlocked?: boolean;

  @Trim()
  @ApiPropertyOptional({ description: 'Email for sending purchase orders', example: 'orders@acme.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  orderEmail?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Phone for order communication', example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  orderPhone?: string | null;
}
