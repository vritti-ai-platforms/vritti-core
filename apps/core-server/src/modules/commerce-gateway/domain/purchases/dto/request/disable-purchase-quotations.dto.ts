import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DisablePurchaseQuotationsDto {
  @ApiProperty({ description: 'Why the purchase no longer needs quotations; recorded', example: 'Sole supplier' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
