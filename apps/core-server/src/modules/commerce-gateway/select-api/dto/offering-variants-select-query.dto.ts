import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

// Variants are only meaningful within their offering, so the parent is required rather than optional
export class OfferingVariantsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiProperty({ description: 'Offering whose variants are listed' })
  @IsUUID('7')
  offeringId: string;

  @ApiPropertyOptional({ description: 'Hide the variants this catalog already lists for any batch' })
  @IsOptional()
  @IsUUID('7')
  catalogId?: string;
}
