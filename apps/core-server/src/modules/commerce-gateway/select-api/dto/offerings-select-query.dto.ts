import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class OfferingsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Hide the offerings whose every variant this catalog already lists' })
  @IsOptional()
  @IsUUID('7')
  catalogId?: string;
}
