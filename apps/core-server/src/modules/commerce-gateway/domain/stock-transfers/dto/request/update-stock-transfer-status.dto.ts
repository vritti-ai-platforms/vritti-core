import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateStockTransferStatusDto {
  @ApiProperty({ description: 'New transfer status', example: 'IN_TRANSIT' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ description: 'Source inventory location ID' })
  @IsUUID()
  fromLocationId: string;

  @ApiProperty({ description: 'Destination inventory location ID' })
  @IsUUID()
  toLocationId: string;

  @ApiPropertyOptional({ description: 'User ID who received the transfer' })
  @IsOptional()
  @IsUUID()
  receivedBy?: string;
}
