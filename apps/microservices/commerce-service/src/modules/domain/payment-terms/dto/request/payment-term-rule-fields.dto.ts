import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class PaymentTermRuleFieldsDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  percent: number;

  @IsInt()
  @Min(0)
  dueDays: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99.99)
  discountPercent?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountDays?: number | null;
}
