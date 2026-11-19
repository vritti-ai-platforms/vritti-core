import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ChangePurchaseMinQuotationsDto {
  @ApiProperty({ description: 'Posted quotations each item needs before its supplier is submitted', example: 3 })
  @IsInt()
  @Min(1)
  minQuotations: number;

  @ApiPropertyOptional({ description: 'Why fewer are enough; required to lower the minimum, recorded', nullable: true })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string | null;
}
