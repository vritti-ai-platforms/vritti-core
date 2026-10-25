import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class OfferingVariantsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Offering whose variants are listed; every reachable offering when omitted' })
  @IsOptional()
  @IsUUID('7')
  offeringId?: string;

  @ApiPropertyOptional({ description: 'Hide the variants this catalog already lists for any batch' })
  @IsOptional()
  @IsUUID('7')
  catalogId?: string;
}
