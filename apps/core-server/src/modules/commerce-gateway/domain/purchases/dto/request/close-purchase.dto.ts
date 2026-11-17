import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ClosePurchaseDto {
  @Trim()
  @ApiPropertyOptional({
    description: 'Why the purchase is closed',
    nullable: true,
    example: 'Month end; the rest moves to the next purchase.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string | null;
}
