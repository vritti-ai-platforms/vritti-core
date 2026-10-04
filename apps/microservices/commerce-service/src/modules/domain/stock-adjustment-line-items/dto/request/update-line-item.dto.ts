import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateLineItemDto {
  @IsUUID('7')
  @IsNotEmpty()
  adjustmentId: string;

  @IsUUID('7')
  @IsNotEmpty()
  lineId: string;

  @IsUUID('7')
  @IsNotEmpty()
  itemId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber: string;
}
