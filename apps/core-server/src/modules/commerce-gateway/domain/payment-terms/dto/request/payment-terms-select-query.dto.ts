import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class PaymentTermsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({
    description: 'When true, draft and inactive terms are returned too (navigation, not picking)',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeAll?: boolean;
}
