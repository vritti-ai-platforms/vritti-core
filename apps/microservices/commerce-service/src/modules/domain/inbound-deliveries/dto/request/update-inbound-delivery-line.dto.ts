import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class UpdateInboundDeliveryLineDto {
  @IsUUID('7')
  inboundDeliveryId: string;

  @IsUUID('7')
  lineId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity: number;
}
