import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsOptional, IsUUID } from 'class-validator';

export class SerialsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Filter serials to a specific inventory quant' })
  @IsOptional()
  @IsUUID()
  quantId?: string;
}
