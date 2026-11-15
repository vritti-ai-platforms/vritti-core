import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class RejectPurchaseLegDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  legId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
