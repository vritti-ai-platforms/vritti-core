import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePurchaseDto {
  @Trim()
  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ description: 'Whether supplier quotations are collected before sourcing' })
  @IsBoolean()
  quotationsRequired: boolean;

  @ApiPropertyOptional({
    description: 'Suppliers that must have posted a quotation to complete quotations',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuotations?: number;
}
