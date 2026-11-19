import { DisplayUomQuantityResponseDto } from '@commerce/uom/dto/response/display-uom-quantity-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { PurchaseOrderItemResponseDto } from './purchase-order-item-response.dto';

export class PurchaseOrderItemDisplayResponseDto {
  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  primaryUomQty: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  expectedFreePrimaryQty: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  receivedPrimaryQty: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  rejectedPrimaryQty: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  invoicedPrimaryQty: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  returnedPrimaryQty: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  cancelledPrimaryQty: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  duePrimaryQty: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  openToReceivePrimaryQty: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  openToInvoicePrimaryQty: DisplayUomQuantityResponseDto | null;
}

export class PurchaseOrderItemTableRowResponseDto extends PurchaseOrderItemResponseDto {
  @ApiProperty({
    type: PurchaseOrderItemDisplayResponseDto,
    description: "Each primary-unit quantity of the line in its item's display unit",
  })
  display: PurchaseOrderItemDisplayResponseDto;
}

export class PurchaseOrderItemTableResponseDto extends TableResponseDto<PurchaseOrderItemTableRowResponseDto> {
  @ApiProperty({ type: [PurchaseOrderItemTableRowResponseDto] })
  declare result: PurchaseOrderItemTableRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
