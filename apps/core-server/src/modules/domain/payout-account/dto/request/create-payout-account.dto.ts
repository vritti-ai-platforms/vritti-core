import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

// The legal entity is the bank account's own
export class CreatePayoutAccountDto {
  @ApiProperty({ description: 'The bank account the money is paid into', example: 'uuid-here' })
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({ description: "The organization's own gateway config or one of Vritti's", example: 'uuid-here' })
  @IsUUID()
  paymentGatewayConfigId: string;

  @ApiProperty({
    description: "The account's id at the gateway: a linked account, or the gateway's main account",
    example: 'acc_Hx81aBcDeF',
  })
  @Trim({ nullify: false })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  gatewayAccountId: string;
}
