import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelPurchaseDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Why the purchase is cancelled', example: 'Requirement moved to next month.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
