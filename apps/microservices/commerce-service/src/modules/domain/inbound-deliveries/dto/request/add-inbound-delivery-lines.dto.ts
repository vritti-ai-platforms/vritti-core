import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsNumber, IsPositive, IsUUID, ValidateNested } from 'class-validator';

export class AddInboundDeliveryLineDto {
  @IsUUID('7')
  purchaseOrderItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity: number;
}

export class AddInboundDeliveryLinesDto {
  @IsUUID('7')
  inboundDeliveryId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((line: AddInboundDeliveryLineDto) => line.purchaseOrderItemId)
  @ValidateNested({ each: true })
  @Type(() => AddInboundDeliveryLineDto)
  lines: AddInboundDeliveryLineDto[];
}
