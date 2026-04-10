import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateGoodsReceiptItemDto {
  @ApiProperty({ description: 'Purchase order item ID' })
  @IsUUID()
  purchaseOrderItemId: string;

  @ApiProperty({ description: 'Accepted quantity', example: 90 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  acceptedQuantity: number;

  @ApiPropertyOptional({ description: 'Rejected quantity', example: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  rejectedQuantity?: number;

  @ApiPropertyOptional({ description: 'Reason for rejection' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class CreateGoodsReceiptDto {
  @ApiProperty({ description: 'Purchase order ID' })
  @IsUUID()
  purchaseOrderId: string;

  @ApiPropertyOptional({ description: 'User ID of the person who received the goods' })
  @IsOptional()
  @IsUUID()
  receivedBy?: string;

  @ApiProperty({ description: 'Date the goods were received (ISO string)', example: '2026-04-10' })
  @IsString()
  @IsNotEmpty()
  receivedDate: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Receipt line items', type: [CreateGoodsReceiptItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGoodsReceiptItemDto)
  items: CreateGoodsReceiptItemDto[];
}
