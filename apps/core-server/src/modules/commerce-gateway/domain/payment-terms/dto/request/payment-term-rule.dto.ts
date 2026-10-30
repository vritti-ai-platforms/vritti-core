import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class PaymentTermRuleDto {
  @ApiProperty({ description: 'Share of the invoice this rule makes due', example: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  percent: number;

  @ApiProperty({ description: 'Days after the baseline date the rule falls due', example: 30 })
  @IsInt()
  @Min(0)
  dueDays: number;

  @ApiPropertyOptional({ description: 'Early-payment discount percentage', example: 2, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99.99)
  discountPercent?: number | null;

  @ApiPropertyOptional({
    description: 'Days after the baseline date the discount stays available',
    example: 10,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountDays?: number | null;
}
