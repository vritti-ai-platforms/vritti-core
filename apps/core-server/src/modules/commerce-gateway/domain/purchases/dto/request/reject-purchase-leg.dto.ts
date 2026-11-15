import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectPurchaseLegDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Why the leg is sent back to sourcing', example: 'Price above the agreed unit price.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
