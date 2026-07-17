import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateSupplierDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Updated supplier code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Updated payment terms' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string | null;

  @ApiPropertyOptional({ description: 'Updated lead time in days' })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Updated notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Whether supplier is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
