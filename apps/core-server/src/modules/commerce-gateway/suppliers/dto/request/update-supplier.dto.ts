import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateSupplierDto {
  @ApiPropertyOptional({ description: 'Updated supplier name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated supplier code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Updated mailing address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Updated GSTIN' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  gstin?: string;

  @ApiPropertyOptional({ description: 'Updated payment terms' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Updated lead time in days' })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether supplier is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
