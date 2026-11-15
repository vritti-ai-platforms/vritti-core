import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CreatePurchaseItemDto } from './create-purchase-item.dto';

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

  @ApiPropertyOptional({ type: [CreatePurchaseItemDto], description: 'Items to start the purchase with' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items?: CreatePurchaseItemDto[];
}
