import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class CostCategoriesSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Only active categories that can be charged on an invoice line (not ITEM)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  chargeOnly?: boolean;
}
