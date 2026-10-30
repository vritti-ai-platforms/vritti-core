import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SwitchPayoutChannelAccountDto {
  @ApiProperty({ description: 'True to take payments through this payout account for the scope', example: true })
  @IsBoolean()
  switchedOn: boolean;
}
