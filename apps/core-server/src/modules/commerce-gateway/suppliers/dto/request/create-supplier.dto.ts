import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ description: 'Supplier name', example: 'Acme Foods Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unique supplier code', example: 'SUP-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Primary contact person name' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Mailing address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'GST identification number', example: '22AAAAA0000A1Z5' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  gstin?: string;

  @ApiPropertyOptional({ description: 'Payment terms', example: 'Net 30' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Default lead time in days', example: 7 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
