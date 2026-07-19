import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class AddLineItemDto {
  @IsUUID()
  @IsNotEmpty()
  adjustmentId: string;

  @IsUUID()
  @IsNotEmpty()
  lineId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber: string;
}
