import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class EnablePurchaseQuotationsDto {
  @ApiProperty({ description: 'Posted quotations each item needs before its supplier is submitted', example: 2 })
  @IsInt()
  @Min(1)
  minQuotations: number;
}
