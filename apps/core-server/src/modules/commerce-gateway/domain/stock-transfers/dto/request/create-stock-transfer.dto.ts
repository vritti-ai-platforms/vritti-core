import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateStockTransferDto {
  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID('7')
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty({ description: 'Source site ID' })
  @IsUUID('7')
  @IsNotEmpty()
  fromSiteId: string;

  @ApiProperty({ description: 'Destination site ID' })
  @IsUUID('7')
  @IsNotEmpty()
  toSiteId: string;

  @ApiProperty({ description: 'Source inventory location ID' })
  @IsUUID('7')
  fromLocationId: string;

  @ApiProperty({ description: 'Destination inventory location ID' })
  @IsUUID('7')
  toLocationId: string;

  @ApiProperty({ description: 'Transfer quantity', example: 50 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'User ID who requested the transfer' })
  @IsOptional()
  @IsUUID('7')
  requestedBy?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
