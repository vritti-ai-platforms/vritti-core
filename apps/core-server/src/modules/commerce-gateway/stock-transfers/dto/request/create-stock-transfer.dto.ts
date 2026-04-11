import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateStockTransferDto {
  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty({ description: 'Source business unit ID' })
  @IsUUID()
  @IsNotEmpty()
  fromBuId: string;

  @ApiProperty({ description: 'Destination business unit ID' })
  @IsUUID()
  @IsNotEmpty()
  toBuId: string;

  @ApiProperty({ description: 'Source inventory location ID' })
  @IsUUID()
  fromLocationId: string;

  @ApiProperty({ description: 'Destination inventory location ID' })
  @IsUUID()
  toLocationId: string;

  @ApiProperty({ description: 'Transfer quantity', example: 50 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'User ID who requested the transfer' })
  @IsOptional()
  @IsUUID()
  requestedBy?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
