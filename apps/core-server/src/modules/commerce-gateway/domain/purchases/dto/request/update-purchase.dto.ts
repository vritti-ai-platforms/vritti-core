import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePurchaseDto {
  @Trim()
  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Whether supplier quotations are collected before sourcing' })
  @IsOptional()
  @IsBoolean()
  quotationsRequired?: boolean;

  @ApiPropertyOptional({ description: 'Suppliers that must have posted a quotation to complete quotations' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuotations?: number;
}
