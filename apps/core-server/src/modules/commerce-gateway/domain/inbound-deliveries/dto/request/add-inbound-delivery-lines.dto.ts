import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsNumber, IsPositive, IsUUID, ValidateNested } from 'class-validator';

export class AddInboundDeliveryLineDto {
  @ApiProperty({
    description: "Line of one of the supplier's sent, confirmed or partially received purchase orders for the site",
  })
  @IsUUID('7')
  purchaseOrderItemId: string;

  @ApiProperty({
    description: 'Quantity announced, in the PO line unit, paid and free together; at most what the line has left',
    example: 10,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity: number;
}

export class AddInboundDeliveryLinesDto {
  @ApiProperty({ type: [AddInboundDeliveryLineDto], description: 'Purchase order lines to put on the delivery' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((line: AddInboundDeliveryLineDto) => line.purchaseOrderItemId)
  @ValidateNested({ each: true })
  @Type(() => AddInboundDeliveryLineDto)
  lines: AddInboundDeliveryLineDto[];
}
